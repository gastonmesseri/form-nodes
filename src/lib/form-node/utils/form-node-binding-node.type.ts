import type { WritableSignal } from '@angular/core';

import type { AnyNode } from '../../types/node.type';
import type { FieldNode } from '../../primitives/field.type';

// Angular's template type constructor defaults an omitted node generic to any.
// Infer standalone field values from the value input in that case.
export type BoundNode<TNode extends AnyNode | WritableSignal<unknown>, TValue> = 0 extends (1 & TNode) ? FieldNode<TValue> : [TNode] extends [never] ? FieldNode<TValue> : TNode extends AnyNode ? TNode : TNode extends WritableSignal<infer TSignalValue> ? FieldNode<TSignalValue> : never;
