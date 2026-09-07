import { APP_ID, effect, reflectComponentType, untracked, type Injector, type Type } from '@angular/core';

import type { Node } from '../../types/node.type';
import { getFormNodeName } from './form-node-name';
import { readMetadata } from '../../metadata/metadata';
import { FORM_NODE_SYNC_INPUTS } from '../provide-form-nodes-config';
import { getNodeInputConfig } from '../../configuration/node-input-config';
import { getGlobalSyncInputs } from '../../configuration/configure-global-form-nodes';
import { isInputSignal, warnFailedInputWrite, writeComponentInput, writeInputSignal } from '../angular-internals/component-input-writer';
import { MIN_METADATA, MAX_METADATA, MIN_DATE_METADATA, MAX_DATE_METADATA, MIN_LENGTH_METADATA, MAX_LENGTH_METADATA, PATTERN_METADATA } from '../../validation/constraint-metadata';

export type SignalControlInputConnection = {
  inputNames: ReadonlySet<string>;
};

const inputNamesToSync = [
  'disabled', 'disabledReasons', 'dirty', 'errors', 'hidden', 'invalid', 'max', 'maxLength',
  'min', 'minLength', 'name', 'pattern', 'pending', 'readonly', 'required', 'touched',
] as const;

type ControlInput = typeof inputNamesToSync[number];

const readBindingValue = (node: Node, name: ControlInput, appId: string) => {
  const metadata = getNodeInputConfig(node).metadata;
  const readers = {
    disabled: () => node.$api.disabled(),
    disabledReasons: () => node.$api.disabledReasons(),
    dirty: () => node.$api.dirty(),
    errors: () => node.$api.errors(),
    hidden: () => node.$api.hidden(),
    invalid: () => node.$api.invalid(),
    max: () => readMetadata(metadata(), MAX_DATE_METADATA) ?? readMetadata(metadata(), MAX_METADATA),
    maxLength: () => readMetadata(metadata(), MAX_LENGTH_METADATA),
    min: () => readMetadata(metadata(), MIN_DATE_METADATA) ?? readMetadata(metadata(), MIN_METADATA),
    minLength: () => readMetadata(metadata(), MIN_LENGTH_METADATA),
    name: () => getFormNodeName(node, appId),
    pattern: () => readMetadata(metadata(), PATTERN_METADATA),
    pending: () => node.$api.pending(),
    readonly: () => node.$api.readonly(),
    required: () => node.$api.required(),
    touched: () => node.$api.touched(),
  };
  return readers[name]();
};

/** @experimental Opt-in synchronization of matching custom-control inputs through Angular internals. */
export const connectSignalControlInputs = <TNode extends Node>(
  control: object,
  node: () => TNode,
  injector: Injector,
  usesControlState = false,
): SignalControlInputConnection => {
  const appId = injector.get(APP_ID);
  const inheritedMode = injector.get(FORM_NODE_SYNC_INPUTS, null) ?? getGlobalSyncInputs();
  let mirror: ReturnType<typeof reflectComponentType> = null;
  try {
    mirror = reflectComponentType((control as { constructor: Type<unknown> }).constructor);
  } catch {
    // Fall back to structural signal-input discovery when component reflection is unavailable.
  }
  const inputs = mirror
    ? new Map(mirror.inputs.map(input => [input.templateName, input.propName]))
    : new Map(inputNamesToSync.flatMap((name) => {
      const candidate = (control as Record<PropertyKey, unknown>)[name];
      return isInputSignal(candidate) ? [[name, name]] : [];
    }));
  const inputNames = new Set(inputs.keys());
  const bindings = inputNamesToSync.flatMap((name) => {
    const property = inputs.get(name);
    return property ? [{ name, property }] : [];
  });
  if (!bindings.length) return { inputNames };

  effect(() => {
    const currentNode = node();
    const config = getNodeInputConfig(currentNode);
    const mode = config.mode === undefined ? inheritedMode : config.mode;
    if (mode === false || mode === null) return;
    const selection = typeof mode === 'object'
      ? ('inputs' in mode ? mode : { mode: 'always' as const, inputs: mode })
      : { mode, inputs: undefined };
    const selected = bindings.filter(({ name }) => {
      return (!selection.inputs || selection.inputs.includes(name))
        && (selection.mode === 'always' || config.declared.has(name));
    });
    const values = selected.map(binding => ({ ...binding, value: readBindingValue(currentNode, binding.name, appId) }));
    untracked(() => {
      return values.forEach(({ name, property, value }) => {
        const written = mirror
          ? writeComponentInput(control, name, value, injector)
          : writeInputSignal((control as Record<PropertyKey, unknown>)[property], value);
        if (!written) warnFailedInputWrite(control, name, usesControlState);
      });
    });
  }, { injector });
  return { inputNames };
};
