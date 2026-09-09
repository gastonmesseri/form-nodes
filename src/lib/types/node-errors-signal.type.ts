import type { Signal } from '@angular/core';

import type { AnyNode } from './node.type';
import type { ValidationErrorWithTargetNode } from '../validation/validation.type';

/**
 * Reactive own-error signal with an optional descendant query.
 * Calling with no options or descendants:false preserves the owning node's target type.
 * descendants:true includes the subtree and is equivalent to allErrors(); descendant targets
 * retain their original nodes and therefore have the broader AnyNode type.
 *
 * @example
 * ```ts
 * profile.errors();
 * profile.errors({ descendants: true });
 * ```
 *
 * @reactive Reads the existing own-error or subtree-error signal without creating per-call caches.
 */
export type NodeErrorsSignal<TNode extends AnyNode = AnyNode> = {
  (options?: { descendants?: false }): readonly ValidationErrorWithTargetNode<TNode>[];
  (options: { descendants: true }): readonly ValidationErrorWithTargetNode<AnyNode>[];
  (options: { descendants?: boolean }): readonly ValidationErrorWithTargetNode<AnyNode>[];
} & Signal<readonly ValidationErrorWithTargetNode<TNode>[]>;
