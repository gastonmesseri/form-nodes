import { effect, reflectComponentType, untracked, ɵSIGNAL, type Injector, type Type, type ɵInputSignalNode } from '@angular/core';

import type { Field } from '../../primitives/field';
import type { FormNodeControl } from './form-node-control';

type InputSignal = ((...args: never[]) => unknown) & {
  [ɵSIGNAL]?: ɵInputSignalNode<unknown, unknown>;
};

const getBindingValues = <TValue>(field: Field<TValue>) => ({
  disabled: field.disabled(),
  dirty: field.dirty(),
  errors: field.errors(),
  hidden: field.hidden(),
  invalid: field.invalid(),
  name: field.path().at(-1) ?? '',
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
  control: FormNodeControl<TValue>,
  field: () => Field<TValue>,
  injector: Injector,
) => {
  const mirror = reflectComponentType(control.constructor as Type<FormNodeControl<TValue>>);
  if (!mirror) return;
  const inputs = new Map(mirror.inputs.map((input) => [input.templateName, input.propName]));
  const bindingNames = Object.keys(getBindingValues(field())) as (keyof ReturnType<typeof getBindingValues<TValue>>)[];
  const bindings = bindingNames.flatMap((name) => {
    const property = inputs.get(name);
    return property ? [{ name, input: control[property as keyof typeof control] as InputSignal }] : [];
  });
  if (!bindings.length) return;

  effect(() => {
    const currentField = field();
    const values = getBindingValues(currentField);
    untracked(() => bindings.forEach(({ name, input }) => writeInputSignal(input, values[name])));
  }, { injector });
};
