import type { Injector, Signal } from '@angular/core';

import type { Node } from './node.type';

/** Public view of a concrete `[formNode]` binding. */
export type FormNodeBinding = {
  /** Host element carrying the `[formNode]` directive. */
  readonly element: HTMLElement;
  /** Injector belonging to the binding's host element. */
  readonly injector: Injector;
  /** Reactive reference to the node currently bound to the host. */
  readonly node: Signal<Node>;
  /** Focuses this binding using its native or custom-control focus behavior. */
  focus(options?: FocusOptions): void;
};
