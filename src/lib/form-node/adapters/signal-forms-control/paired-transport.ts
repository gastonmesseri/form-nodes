import { reflectComponentType, type Injector, type Type } from '@angular/core';

import type { FormNodeControl } from '../../form-node-control';
import type { AnyNode, NodeValue } from '../../../types/node.type';
import { warnFailedInputWrite, writeComponentInput } from '../../ng-internals/component-input-writer';

type PairedControlModel<TValue> = {
  (): TValue;
  set(value: TValue): void;
};

/** Creates the internal input writer; output events are dispatched by the binding's host listeners. */
export const createPairedTransport = <TNode extends AnyNode>(
  control: FormNodeControl<NodeValue<TNode>, TNode>,
  injector: Injector,
  usesControlState: boolean,
): PairedControlModel<NodeValue<TNode>> => {
  const mirror = reflectComponentType((control as unknown as { constructor: Type<unknown> }).constructor);
  const record = control as unknown as Record<string, unknown>;
  for (const name of ['value', 'checked'] as const) {
    const input = mirror?.inputs.find(({ templateName }) => templateName === name);
    const output = mirror?.outputs.find(({ templateName }) => templateName === `${name}Change`);
    if (!input || !output) continue;
    const emitter = record[output.propName] as { subscribe?: unknown } | undefined;
    if (typeof emitter?.subscribe !== 'function') continue;
    let lastValue: unknown = Symbol('unset');
    const model = (() => lastValue) as PairedControlModel<NodeValue<TNode>>;
    model.set = (value) => {
      if (writeComponentInput(control, name, value, injector)) lastValue = value;
      else warnFailedInputWrite(control, name, usesControlState);
    };
    return model;
  }
  throw new Error('formNode: a custom control requires a \'value\' or \'checked\' model, or a matching input-output pair');
};
