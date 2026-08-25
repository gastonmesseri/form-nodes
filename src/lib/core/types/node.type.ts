import type { Signal } from '@angular/core';

import type { HiddenFunctionMembers } from './hidden-function-members.type';

export type MarkAsTouchedOptions = {
  /** When true, marks only the current node and leaves its descendants untouched. */
  skipDescendants?: boolean;
};

export type NodeControlBinding = {
  readonly element: Element;
  focus(options?: FocusOptions): void;
};

export type NodeApi = {
  form: Signal<Node | null>;
  path: Signal<readonly string[]>;
  value: Signal<any>;
  /**
   * Property or array index under which this node is stored, or `null` when it is a root node.
   *
   * @example
   * `myForm.age.keyInParent()` returns `'age'`.
   */
  keyInParent: Signal<string | number | null>;
  set(value: any): void;
  update(updater: (value: any) => any): void;
  patch(value: any): void;
  reset(...args: [] | [value: any]): void;
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  errors: Signal<readonly { readonly kind: string; readonly targetNode: Node }[]>;
  allErrors: Signal<readonly { readonly kind: string; readonly targetNode: Node }[]>;
  getError<TKind extends string>(kind: TKind): ({ readonly kind: TKind; readonly targetNode: Node }) | undefined;
  required: Signal<boolean>;
  pending: Signal<boolean>;
  submitting: Signal<boolean>;
  debouncing: Signal<boolean>;
  flush(): void;
  /** Focuses the first control bound to this node or its descendants, when one exists. */
  focus(options?: FocusOptions): void;
  touched: Signal<boolean>;
  untouched: Signal<boolean>;
  markAsTouched(options?: MarkAsTouchedOptions): void;
  markAsUntouched(): void;
  dirty: Signal<boolean>;
  pristine: Signal<boolean>;
  markAsDirty(): void;
  markAsPristine(): void;
  disabled: Signal<boolean>;
  enabled: Signal<boolean>;
  disable(): void;
  enable(): void;
  readonly: Signal<boolean>;
  writable: Signal<boolean>;
  markAsReadonly(): void;
  markAsWritable(): void;
  hidden: Signal<boolean>;
  visible: Signal<boolean>;
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
  _controlDebounce: Signal<number | undefined>;
  _controlValue: Signal<any>;
  _setControlValue(value: any): void;
  _clone(): Node;
  _setParent(parent: Node | null, key?: string | number): void;
  _registerControlBinding(binding: NodeControlBinding): () => void;
  _getControlBindingForFocus(): NodeControlBinding | undefined;
};
export type InternalNode = (() => any) & { api: InternalNodeApi };
export type Nodes = Record<string, Node>;
export type NodeDefinition = Node | NodeDefinitions;
export interface NodeDefinitions {
  [key: string]: NodeDefinition;
}
export type NodeValue<TNode> = TNode extends () => infer TValue ? TValue : never;
export type NodeKeyInParent<TParent extends Node> = Node extends TParent
  ? string | number | null
  : NodeValue<TParent> extends readonly unknown[] ? number | null : string;
export type NodeSet<TNode> =
  TNode extends { api: { set(value: infer TValue): void } } ? TValue : never;
export type NodePatch<TNode> =
  TNode extends { api: { patch(value: infer TValue): void } } ? TValue : never;
