import { APP_ID, ChangeDetectorRef, effect, reflectComponentType, untracked, ɵSIGNAL, type Injector, type Type, type ɵInputSignalNode } from '@angular/core';

import { getFormNodeName } from './form-node-name';
import type { Field } from '../../../primitives/field';
import type { Node } from '../../../types/node.type';

type InputSignal = ((...args: never[]) => unknown) & {
  [ɵSIGNAL]?: ɵInputSignalNode<unknown, unknown>;
};

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

const writeInputSignal = (input: InputSignal, value: unknown) => {
  if (typeof input !== 'function') return;
  const node = input[ɵSIGNAL];
  if (!node?.applyValueToInputSignal) return;
  const transformedValue = node.transformFn ? node.transformFn(value) : value;
  node.applyValueToInputSignal(node, transformedValue);
};

/** Writes a component input using public metadata while preserving signal-input transforms. */
export const writeComponentInput = (control: object, name: string, value: unknown, injector: Injector): boolean => {
  const mirror = reflectComponentType((control as { constructor: Type<unknown> }).constructor);
  const inputMetadata = mirror?.inputs.find(({ templateName }) => templateName === name);
  if (!inputMetadata) return false;
  const record = control as Record<PropertyKey, unknown>;
  const inputValue = record[inputMetadata.propName];
  if (inputMetadata.isSignal) writeInputSignal(inputValue as InputSignal, value);
  else record[inputMetadata.propName] = inputMetadata.transform ? inputMetadata.transform(value) : value;
  injector.get(ChangeDetectorRef).markForCheck();
  return true;
};

/** Synchronizes the standard Angular Signal Forms state inputs implemented by a custom control. */
export const connectSignalControlInputs = <TNode extends Node>(
  control: object,
  node: () => TNode,
  injector: Injector,
): SignalControlInputConnection => {
  const appId = injector.get(APP_ID);
  const mirror = reflectComponentType((control as { constructor: Type<unknown> }).constructor);
  const bindingValues = getBindingValues(node(), appId);
  const inputs = mirror
    ? new Map(mirror.inputs.map((input) => [input.templateName, input.propName]))
    : new Map(Object.keys(bindingValues).flatMap((name) => {
      const candidate = (control as Record<PropertyKey, unknown>)[name];
      return typeof candidate === 'function' && (candidate as InputSignal)[ɵSIGNAL]?.applyValueToInputSignal ? [[name, name]] : [];
    }));
  const inputNames = new Set(inputs.keys());
  const bindingNames = Object.keys(bindingValues) as (keyof ReturnType<typeof getBindingValues>)[];
  const bindings = bindingNames.flatMap((name) => {
    const property = inputs.get(name);
    return property ? [{ name, input: (control as Record<PropertyKey, unknown>)[property] as InputSignal }] : [];
  });
  if (!bindings.length) return { inputNames };

  effect(() => {
    const currentNode = node();
    const values = getBindingValues(currentNode, appId);
    untracked(() => bindings.forEach(({ name, input }) => writeInputSignal(input, values[name])));
  }, { injector });
  return { inputNames };
};
