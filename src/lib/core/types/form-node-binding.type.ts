import type { Injector, Signal } from '@angular/core';

import type { Node } from './node.type';
import type { ValidationError } from '../validation/validation.type';

/** Public view of a concrete `[formNode]` binding. */
export type FormNodeBinding<TNode extends Node = Node> = {
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
  readonly errors: Signal<readonly ValidationError.WithTargetNode<TNode>[]>;
  /** Focuses this binding using its native or custom-control focus behavior. */
  focus(options?: FocusOptions): void;
  /** Commits pending control-originated values for the bound node. */
  flush(): void;
  /** Resets interaction state and control-specific parsing state. */
  reset(): void;
};
