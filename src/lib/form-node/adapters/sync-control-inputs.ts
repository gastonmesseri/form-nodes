import { APP_ID, computed, effect, reflectComponentType, untracked, type Injector, type Type } from '@angular/core';

import type { AnyNode } from '../../types/node.type';
import { controlRequired } from './control-required';
import { readMetadata } from '../../metadata/metadata';
import { getFormNodeName } from '../utils/form-node-name';
import { FORM_NODE_SYNC_INPUTS } from '../provide-form-nodes-config';
import { getNodeInputConfig } from '../../configuration/node-input-config';
import { getGlobalSyncInputs } from '../../configuration/configure-global-form-nodes';
import { isInputSignal, warnFailedInputWrite, writeComponentInput, writeInputSignal } from '../ng-internals/component-input-writer';
import { MIN_METADATA, MAX_METADATA, MIN_DATE_METADATA, MAX_DATE_METADATA, MIN_LENGTH_METADATA, MAX_LENGTH_METADATA, PATTERN_METADATA } from '../../validation/constraint-metadata';

export type SignalControlInputConnection = {
  inputNames: ReadonlySet<string>;
};

const inputNamesToSync = [
  'disabled', 'disabledReasons', 'dirty', 'errors', 'hidden', 'invalid', 'max', 'maxLength',
  'min', 'minLength', 'name', 'pattern', 'pending', 'readonly', 'required', 'touched',
] as const;

type ControlInput = typeof inputNamesToSync[number];

const readBindingValue = (node: AnyNode, name: ControlInput, appId: string, required: () => boolean) => {
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
    required,
    touched: () => node.$api.touched(),
  };
  return readers[name]();
};

/** @experimental Opt-in synchronization of matching custom-control inputs through Angular internals. */
export const connectControlInputs = <TNode extends AnyNode>(
  control: object,
  node: () => TNode,
  injector: Injector,
  usesControlState = false,
  controlKind: 'signal-controls' | 'cva' | 'pairs' = 'cva',
  isConnected: () => boolean = () => true,
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

  const required = computed(() => controlRequired(node(), inputNames.has('checked')));
  effect(() => {
    if (!isConnected()) return;
    const currentNode = node();
    const config = getNodeInputConfig(currentNode);
    const configured = config.mode === undefined ? inheritedMode : config.mode;
    if (configured === false || configured === null) return;
    const selection = typeof configured === 'object'
      ? ('inputs' in configured ? configured : { inputs: configured })
      : configured === 'signal-controls'
        ? { inputs: 'all' as const, target: 'signal-controls' as const }
        : { inputs: configured };
    if (selection.target && selection.target !== 'all' && selection.target !== controlKind) return;
    const selected = bindings.filter(({ name }) => {
      return selection.inputs === 'all'
        || (selection.inputs === 'declared' ? config.declared.has(name) : selection.inputs.includes(name));
    });
    const values = selected.map(binding => ({ ...binding, value: readBindingValue(currentNode, binding.name, appId, required) }));
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
