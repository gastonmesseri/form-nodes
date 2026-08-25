import { APP_ID, effect, reflectComponentType, untracked, ɵSIGNAL, type Injector, type Type, type ɵInputSignalNode } from '@angular/core';

import { getFormNodeName } from './form-node-name';
import type { Field } from '../../../primitives/field';
import type { Node } from '../../../types/node.type';

type InputSignal = ((...args: never[]) => unknown) & {
  [ɵSIGNAL]?: ɵInputSignalNode<unknown, unknown>;
};

const getBindingValues = (node: Node, appId: string) => {
  const field = node as unknown as Partial<Field<unknown>>;
  return {
    disabled: node.api.disabled(),
    dirty: node.api.dirty(),
    errors: node.api.errors(),
    hidden: node.api.hidden(),
    invalid: node.api.invalid(),
    max: field.max?.() ?? undefined,
    maxLength: field.maxLength?.() ?? undefined,
    min: field.min?.() ?? undefined,
    minLength: field.minLength?.() ?? undefined,
    name: getFormNodeName(node, appId),
    pattern: field.pattern?.() ?? [],
    pending: node.api.pending(),
    readonly: node.api.readonly(),
    required: node.api.required(),
    touched: node.api.touched(),
  };
};

const writeInputSignal = (input: InputSignal, value: unknown) => {
  if (typeof input !== 'function') return;
  const node = input[ɵSIGNAL];
  if (!node?.applyValueToInputSignal) return;
  const transformedValue = node.transformFn ? node.transformFn(value) : value;
  node.applyValueToInputSignal(node, transformedValue);
};

/** Synchronizes the standard Angular Signal Forms state inputs implemented by a custom control. */
export const connectSignalControlInputs = <TNode extends Node>(
  control: object,
  node: () => TNode,
  injector: Injector,
) => {
  const appId = injector.get(APP_ID);
  const mirror = reflectComponentType((control as { constructor: Type<unknown> }).constructor);
  if (!mirror) return;
  const inputs = new Map(mirror.inputs.map((input) => [input.templateName, input.propName]));
  const bindingNames = Object.keys(getBindingValues(node(), appId)) as (keyof ReturnType<typeof getBindingValues>)[];
  const bindings = bindingNames.flatMap((name) => {
    const property = inputs.get(name);
    return property ? [{ name, input: (control as Record<PropertyKey, unknown>)[property] as InputSignal }] : [];
  });
  if (!bindings.length) return;

  effect(() => {
    const currentNode = node();
    const values = getBindingValues(currentNode, appId);
    untracked(() => bindings.forEach(({ name, input }) => writeInputSignal(input, values[name])));
  }, { injector });
};
