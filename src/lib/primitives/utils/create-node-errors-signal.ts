import type { Signal } from '@angular/core';

import type { AnyNode } from '../../types/node.type';
import type { NodeErrorsSignal } from '../../types/node-errors-signal.type';
import type { ValidationErrorWithTargetNode } from '../../validation/validation.type';

/** Preserves the own-error signal identity marker while routing optional subtree reads. */
export function createNodeErrorsSignal<TNode extends AnyNode>(
  own: Signal<readonly ValidationErrorWithTargetNode<TNode>[]>,
  descendants: Signal<readonly ValidationErrorWithTargetNode<AnyNode>[]>,
): NodeErrorsSignal<TNode> {
  return Object.assign((options?: { descendants?: boolean }) => {
    return options?.descendants ? descendants() : own();
  }, own) as NodeErrorsSignal<TNode>;
}
