import type { Injector, Signal, OutputRef } from '@angular/core';

import type { AnyNode, NodeValue } from './node.type';
import type { ValidationErrorWithTargetNode } from '../validation/validation.type';

/** Public view of a concrete `[formNode]` binding. */
export type FormNodeBinding<TNode extends AnyNode = AnyNode> = {
  /**
   * Control-originated value after it is committed, respecting debounce and flush.
   * Programmatic node writes do not emit. Synchronous state is current in the handler;
   * asynchronous validation may still be pending.
   */
  readonly formNodeValueChange: OutputRef<NodeValue<TNode>>;
  /**
   * Latest parsed value received from the selected control adapter, before waiting for debounce.
   * This does not guarantee a physical user interaction: custom controls can emit from code.
   */
  readonly formNodeControlValueChange: OutputRef<NodeValue<TNode>>;
  /** Host element carrying the `[formNode]` directive. */
  readonly element: HTMLElement;
  /** Injector belonging to the binding's host element. */
  readonly injector: Injector;
  /** Reactive reference to the node currently bound to the host. */
  readonly node: Signal<TNode>;
  /**
   * Errors visible to this binding, excluding errors owned by another binding.
   *
   * @example
   * ```ts
   * binding.errors();
   * // [{ kind: 'required', message: 'Value is required.', targetNode: binding.node() }]
   * ```
   */
  readonly errors: Signal<readonly ValidationErrorWithTargetNode<TNode>[]>;
  /** Focuses this binding using its native or custom-control focus behavior. */
  focus(options?: FocusOptions): void;
  /** Commits pending control-originated values for the bound node. */
  flush(): void;
  /** Resets interaction state and control-specific parsing state. */
  reset(): void;
};
