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
  setParentDisabled?: (disabled: boolean) => void;
  readonly: Signal<boolean>;
  markAsReadonly: () => void;
  markAsWritable: () => void;
  setParentReadonly?: (readonly: boolean) => void;
};

export type Node = (() => any) & { api: NodeApi };
export type Nodes = Record<string, Node>;
export type NodeValue<TNode> = TNode extends () => infer TValue ? TValue : never;
export type NodeSet<TNode> =
  TNode extends { api: { set: (value: infer TValue) => void } } ? TValue : never;
export type NodePatch<TNode> =
  TNode extends { api: { patch: (value: infer TValue) => void } } ? TValue : never;
