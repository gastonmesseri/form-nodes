import { APP_ID, effect, reflectComponentType, untracked, type Injector, type Type } from '@angular/core';

import type { Node } from '../../types/node.type';
import { getFormNodeName } from './form-node-name';
import type { Field } from '../../primitives/field';
import { FORM_NODE_CONFIG } from '../form-node-config';
import { isInputSignal, warnFailedInputWrite, writeComponentInput, writeInputSignal } from '../angular-internals/component-input-writer';

export type SignalControlInputConnection = {
  inputNames: ReadonlySet<string>;
};

const getBindingValues = (node: Node, appId: string) => {
  const field = node as unknown as Partial<Field<unknown>>;
  return {
    disabled: node.$api.disabled(),
    disabledReasons: node.$api.disabledReasons(),
    dirty: node.$api.dirty(),
    errors: node.$api.errors(),
    hidden: node.$api.hidden(),
    invalid: node.$api.invalid(),
    max: field.max?.() ?? undefined,
    maxLength: field.maxLength?.() ?? undefined,
    min: field.min?.() ?? undefined,
    minLength: field.minLength?.() ?? undefined,
    name: getFormNodeName(node, appId),
    pattern: field.pattern?.() ?? [],
    pending: node.$api.pending(),
    readonly: node.$api.readonly(),
    required: node.$api.required(),
    touched: node.$api.touched(),
  };
};

/** Synchronizes the standard Angular Signal Forms state inputs implemented by a custom control. */
export const connectSignalControlInputs = <TNode extends Node>(
  control: object,
  node: () => TNode,
  injector: Injector,
  usesControlState = false,
): SignalControlInputConnection => {
  const appId = injector.get(APP_ID);
  let mirror: ReturnType<typeof reflectComponentType> = null;
  try {
    mirror = reflectComponentType((control as { constructor: Type<unknown> }).constructor);
  } catch {
    // Fall back to structural signal-input discovery when component reflection is unavailable.
  }
  const bindingValues = getBindingValues(node(), appId);
  const inputs = mirror
    ? new Map(mirror.inputs.map(input => [input.templateName, input.propName]))
    : new Map(Object.keys(bindingValues).flatMap((name) => {
      const candidate = (control as Record<PropertyKey, unknown>)[name];
      return isInputSignal(candidate) ? [[name, name]] : [];
    }));
  const inputNames = new Set(inputs.keys());
  if (injector.get(FORM_NODE_CONFIG, null)?.syncControlInputs === false) return { inputNames };
  const bindingNames = Object.keys(bindingValues) as (keyof ReturnType<typeof getBindingValues>)[];
  const bindings = bindingNames.flatMap((name) => {
    const property = inputs.get(name);
    return property ? [{ name, property }] : [];
  });
  if (!bindings.length) return { inputNames };

  effect(() => {
    const currentNode = node();
    const values = getBindingValues(currentNode, appId);
    untracked(() => {
      return bindings.forEach(({ name, property }) => {
        const written = mirror
          ? writeComponentInput(control, name, values[name], injector)
          : writeInputSignal((control as Record<PropertyKey, unknown>)[property], values[name]);
        if (!written) warnFailedInputWrite(control, name, usesControlState);
      });
    });
  }, { injector });
  return { inputNames };
};
