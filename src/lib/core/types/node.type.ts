import type { Signal } from '@angular/core';

import type { HiddenFunctionMembers } from './hidden-function-members.type';

export type NodeApi = {
  form: Signal<Node | null>;
  path: Signal<readonly string[]>;
  set(value: any): void;
  patch(value: any): void;
  reset(...args: [] | [value: any]): void;
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  pending: Signal<boolean>;
  touched: Signal<boolean>;
  markAsTouched(): void;
  markAsUntouched(): void;
  dirty: Signal<boolean>;
  markAsDirty(): void;
  markAsPristine(): void;
  disabled: Signal<boolean>;
  disable(): void;
  enable(): void;
  readonly: Signal<boolean>;
  markAsReadonly(): void;
  markAsWritable(): void;
  hidden: Signal<boolean>;
  hide(): void;
  show(): void;
};

export type Node = (() => any) & { api: NodeApi };
export type PublicNode<TNode extends Node> = Node extends TNode
  ? TNode & HiddenFunctionMembers
  : TNode;
type RootLookupDepth = readonly [unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown];

export type RootNode<TNode extends Node, TDepth extends readonly unknown[] = RootLookupDepth> =
  TDepth extends readonly [unknown, ...infer TRest]
    ? TNode extends { api: { parent: Signal<infer TParent | null> } }
      ? TParent extends Node
        ? Node extends TParent ? TNode : RootNode<TParent, TRest>
        : TNode
      : TNode
    : Node;
export type InternalNodeApi = NodeApi & {
  _setParent(parent: Node | null, key?: string): void;
};
export type InternalNode = (() => any) & { api: InternalNodeApi };
export type Nodes = Record<string, Node>;
export type NodeDefinition = Node | NodeDefinitions;
export interface NodeDefinitions {
  [key: string]: NodeDefinition;
}
export type NodeValue<TNode> = TNode extends () => infer TValue ? TValue : never;
export type NodeSet<TNode> =
  TNode extends { api: { set(value: infer TValue): void } } ? TValue : never;
export type NodePatch<TNode> =
  TNode extends { api: { patch(value: infer TValue): void } } ? TValue : never;
