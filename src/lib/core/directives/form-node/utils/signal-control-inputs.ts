import { APP_ID, effect, reflectComponentType, untracked, ɵSIGNAL, type Injector, type Type, type ɵInputSignalNode } from '@angular/core';

import { getFormNodeName } from './form-node-name';
import type { Field } from '../../../primitives/field';

type InputSignal = ((...args: never[]) => unknown) & {
  [ɵSIGNAL]?: ɵInputSignalNode<unknown, unknown>;
};

const getBindingValues = <TValue>(field: Field<TValue>, appId: string) => ({
  disabled: field.disabled(),
  dirty: field.dirty(),
  errors: field.errors(),
  hidden: field.hidden(),
  invalid: field.invalid(),
  max: field.max(),
  maxLength: field.maxLength(),
  min: field.min(),
  minLength: field.minLength(),
  name: getFormNodeName(field, appId),
  pattern: field.pattern(),
  pending: field.pending(),
  readonly: field.readonly(),
  required: field.required(),
  touched: field.touched(),
});

const writeInputSignal = (input: InputSignal, value: unknown) => {
  if (typeof input !== 'function') return;
  const node = input[ɵSIGNAL];
  if (!node?.applyValueToInputSignal) return;
  const transformedValue = node.transformFn ? node.transformFn(value) : value;
  node.applyValueToInputSignal(node, transformedValue);
};

/** Synchronizes the standard Angular Signal Forms state inputs implemented by a custom control. */
export const connectSignalControlInputs = <TValue>(
  control: object,
  field: () => Field<TValue>,
  injector: Injector,
) => {
  const appId = injector.get(APP_ID);
  const mirror = reflectComponentType((control as { constructor: Type<unknown> }).constructor);
  if (!mirror) return;
  const inputs = new Map(mirror.inputs.map((input) => [input.templateName, input.propName]));
  const bindingNames = Object.keys(getBindingValues(field(), appId)) as (keyof ReturnType<typeof getBindingValues<TValue>>)[];
  const bindings = bindingNames.flatMap((name) => {
    const property = inputs.get(name);
    return property ? [{ name, input: (control as Record<PropertyKey, unknown>)[property] as InputSignal }] : [];
  });
  if (!bindings.length) return;

  effect(() => {
    const currentField = field();
    const values = getBindingValues(currentField, appId);
    untracked(() => bindings.forEach(({ name, input }) => writeInputSignal(input, values[name])));
  }, { injector });
};
