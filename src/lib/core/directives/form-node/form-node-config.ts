import { InjectionToken, type Provider } from '@angular/core';

import type { FormNodeBinding } from '../../types/form-node-binding.type';

export type { FormNodeBinding } from '../../types/form-node-binding.type';

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
