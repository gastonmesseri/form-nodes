import type { Signal } from '@angular/core';

import type { ControlState, ControlStateError, ControlStateSource } from './control-state';

export type ControlStateAdapter<TValue> = Omit<ControlState<TValue>, 'form' | 'formSubmitted' | 'connected' | 'source' | 'hasError' | 'getError' | 'hasValidator' | 'hasValidators'> & {
  readonly connected: Signal<boolean>;
  readonly source: ControlStateSource;
  /** Whether this control has directly registered validators, when introspection is supported. */
  readonly hasValidators?: Signal<boolean>;
  /** Registers an independently owned source and returns its cleanup. */
  registerErrors(source: Signal<readonly ControlStateError[]>): () => void;
  /** Revalidates nonreactive Angular controls when the source changes. */
  refreshErrors?(): void;
  /** Optional validator-query capability; the facade handles semantic required queries. */
  hasValidator?(validator: unknown, options?: { resolve?: boolean }): boolean;
};
