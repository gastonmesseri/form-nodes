import { reflectComponentType, type ModelSignal, type Type } from '@angular/core';

import type { FormNodeControl } from '../../form-node-control';
import type { Node, NodeValue } from '../../../types/node.type';

type ModelCandidate<TValue> = (() => TValue) & {
  set?: (value: TValue) => void;
  subscribe?: (listener: (value: TValue) => void) => { unsubscribe(): void };
};

/** Resolves the declared public value/checked model, including aliases, through Angular metadata. */
export const findModelTransport = <TNode extends Node>(control: FormNodeControl<NodeValue<TNode>, TNode>): ModelSignal<NodeValue<TNode>> | undefined => {
  const mirror = reflectComponentType(control.constructor as Type<unknown>);
  const record = control as unknown as Record<string, unknown>;
  for (const name of ['value', 'checked'] as const) {
    const input = mirror?.inputs.find(({ templateName }) => templateName === name);
    const output = mirror?.outputs.find(({ templateName }) => templateName === `${name}Change`);
    if (!input?.isSignal || output?.propName !== input.propName) continue;
    const candidate = record[input.propName] as ModelCandidate<NodeValue<TNode>> | undefined;
    if (typeof candidate === 'function' && typeof candidate.set === 'function' && typeof candidate.subscribe === 'function') {
      return candidate as ModelSignal<NodeValue<TNode>>;
    }
  }
};
