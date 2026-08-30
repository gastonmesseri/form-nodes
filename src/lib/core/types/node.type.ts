import type { Signal } from '@angular/core';

import type { HiddenFunctionMembers } from './hidden-function-members.type';

export type MarkAsTouchedOptions = {
  /** When true, marks only the current node and leaves its descendants untouched. */
  skipDescendants?: boolean;
};

/** A static or reactive condition that disables a node, optionally with a user-facing reason. */
export type DisabledStateSource = boolean | string | (() => boolean | string);

/** Internal strategy used to delay control-originated values before committing them to the model. */
export type ControlDebounce = number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);

/** Identifies one active cause of a node's disabled state. */
export type DisabledReason<TNode extends Node = Node> = {
  /** Node on which this reason originated. Descendants retain the original source node. */
  readonly sourceNode: TNode;
  /** Optional user-facing explanation supplied by the disabled option or disable(). */
  readonly message?: string;
};

export type NodeControlBinding = {
  readonly element: Element;
  focus(options?: FocusOptions): void;
  reset?(): void;
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
  markAsTouched(options?: {
    /** When true, marks only the current node and leaves its descendants untouched. */
    skipDescendants?: boolean;
  }): void;
  markAsUntouched(): void;
  dirty: Signal<boolean>;
  pristine: Signal<boolean>;
  markAsDirty(): void;
  markAsPristine(): void;
  disabled: Signal<boolean>;
  /** Parent reasons followed by the active reasons originating on this node. */
  disabledReasons: Signal<readonly DisabledReason[]>;
  enabled: Signal<boolean>;
  disable(message?: string): void;
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

export type Node = (() => any) & {
  /**
   * Collision-safe access to the node API.
   *
   * Prefer `api` for normal application code. Use `$api` when a form declares a child named
   * `api`, or when generic node code requires an access path that cannot collide with children.
   *
   * Prefer `api` for ordinary application code; `$api` remains a supported, stable escape hatch.
   */
  $api: NodeApi;
};
export type PublicNode<TNode extends Node> = Node extends TNode
  ? TNode & HiddenFunctionMembers
  : TNode;
type RootLookupDepth = readonly [unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown];

export type RootNode<TNode extends Node, TDepth extends readonly unknown[] = RootLookupDepth> =
  TDepth extends readonly [unknown, ...infer TRest]
    ? TNode extends { $api: { parent: Signal<infer TParent | null> } }
      ? TParent extends Node
        ? Node extends TParent ? TNode : RootNode<TParent, TRest>
        : TNode
      : TNode
    : Node;
export type NodeType = 'field' | 'group' | 'form' | 'array';
export type InternalNodeApi = NodeApi & {
  /** Runtime discriminant for internal node capability and implementation selection. */
  readonly _nodeType: NodeType;
  _controlDebounce: Signal<ControlDebounce | undefined>;
  _controlValue: Signal<any>;
  _setControlValue(value: any): void;
  _flushControlValueOnBlur(): void;
  _clone(): Node;
  _setParent(parent: Node | null, key?: string | number): void;
  _refreshInjector(): void;
  _registerControlBinding(binding: NodeControlBinding): () => void;
  _getControlBindingForFocus(): NodeControlBinding | undefined;
};
export type InternalNode = (() => any) & { $api: InternalNodeApi };
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
  TNode extends { $api: { set(value: infer TValue): void } } ? TValue : never;
export type NodePatch<TNode> =
  TNode extends { $api: { patch(value: infer TValue): void } } ? TValue : never;
