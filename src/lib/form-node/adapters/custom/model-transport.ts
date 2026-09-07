import type { ModelSignal } from '@angular/core';

import type { FormNodeControl } from '../../form-node-control';
import type { Node, NodeValue } from '../../../types/node.type';

type ModelCandidate<TValue> = (() => TValue) & {
  set?: (value: TValue) => void;
  subscribe?: (listener: (value: TValue) => void) => { unsubscribe(): void };
};

/** Finds a value or checked model using only its public callable/set/subscribe contract. */
export const findModelTransport = <TNode extends Node>(control: FormNodeControl<NodeValue<TNode>, TNode>): ModelSignal<NodeValue<TNode>> | undefined => {
  for (const name of ['value', 'checked'] as const) {
    const candidate = control[name] as ModelCandidate<NodeValue<TNode>> | undefined;
    if (typeof candidate === 'function' && typeof candidate.set === 'function' && typeof candidate.subscribe === 'function') {
      return candidate as ModelSignal<NodeValue<TNode>>;
    }
  }
};
