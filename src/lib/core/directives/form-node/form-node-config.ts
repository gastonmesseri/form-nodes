import { InjectionToken, type Injector, type Provider, type Signal } from '@angular/core';

import type { Node } from '../../types/node.type';

/** Public view of a concrete `[formNode]` binding supplied to configured class predicates. */
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

export type FormNodeConfig = {
  /**
   * CSS class names and their reactive activation predicates.
   *
   * Each predicate runs in a reactive context. Signals read from the binding or elsewhere cause
   * that class to be reevaluated without reevaluating unrelated class predicates.
   */
  readonly classes?: Readonly<Record<string, (binding: FormNodeBinding) => boolean>>;
};

export const FORM_NODE_CONFIG = new InjectionToken<FormNodeConfig>('FORM_NODE_CONFIG');

/** Configures automatic CSS classes for every `[formNode]` binding below this provider. */
export const provideFormNodeConfig = (config: FormNodeConfig): Provider[] => [{
  provide: FORM_NODE_CONFIG,
  useValue: config,
}];
