import type { Signal } from '@angular/core';

export type NodeApi = {
  set: (value: any) => void;
  patch: (value: any) => void;
  reset: (...args: [] | [value: any]) => void;
  valid: Signal<boolean>;
  touched: Signal<boolean>;
  markAsTouched: () => void;
  markAsUntouched: () => void;
  dirty: Signal<boolean>;
  markAsDirty: () => void;
  markAsPristine: () => void;
  disabled: Signal<boolean>;
  disable: () => void;
  enable: () => void;
  readonly: Signal<boolean>;
  markAsReadonly: () => void;
  markAsWritable: () => void;
  hidden: Signal<boolean>;
  hide: () => void;
  show: () => void;
  _setParent?: (parent: NodeApi | null) => void;
};

export type Node = (() => any) & { api: NodeApi };
export type Nodes = Record<string, Node>;
export type NodeDefinition = Node | NodeDefinitions;
export interface NodeDefinitions {
  [key: string]: NodeDefinition;
}
export type NodeValue<TNode> = TNode extends () => infer TValue ? TValue : never;
export type NodeSet<TNode> =
  TNode extends { api: { set: (value: infer TValue) => void } } ? TValue : never;
export type NodePatch<TNode> =
  TNode extends { api: { patch: (value: infer TValue) => void } } ? TValue : never;
