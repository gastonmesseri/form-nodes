import { signal, untracked } from '@angular/core';

import type { FormNodeBinding } from '../types/form-node-binding.type';
import type { ValidatorMessages } from '../validation/validator-messages';

/** Process-wide defaults below injector-scoped configuration. */
export type GlobalFormNodesConfig = {
  /** Static or reactive fallback catalog. Null clears it; omission preserves the current catalog. */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined) | null | undefined;

  /** Default for newly connected controls. Null restores true; omission preserves the current setting. */
  syncControlInputs?: boolean | null | undefined;

  /** Default class map for new bindings. Null clears it; explicit maps replace rather than merge. */
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
};

type Registration<T> = {
  value: T;
  active: boolean;
  previous: Registration<T> | null;
};

const globalOption = <T>(initial: T) => {
  const current = signal<Registration<T>>({ value: initial, active: true, previous: null });
  return {
    read: () => current().value,
    configure(value: T) {
      const registration: Registration<T> = { value, active: true, previous: untracked(current) };
      current.set(registration);
      return () => {
        if (!registration.active) return;
        registration.active = false;
        if (untracked(current) !== registration) return;
        let previous = registration.previous!;
        while (!previous.active) previous = previous.previous!;
        current.set(previous);
      };
    },
  };
};

const messages = globalOption<ValidatorMessages | (() => ValidatorMessages | undefined)>({});
const classes = globalOption<Record<string, (binding: FormNodeBinding) => boolean>>({});
const syncControlInputs = globalOption(true);

export const getGlobalValidatorMessages = messages.read;
export const getGlobalFormNodeClasses = () => untracked(classes.read);
export const getGlobalSyncControlInputs = () => untracked(syncControlInputs.read);

/**
 * Configures process-wide defaults below Angular providers. Call before bootstrapping bindings.
 * Omitted options preserve previous settings; null restores the selected library default.
 * Classes and input synchronization are captured when bindings connect. Message sources and
 * selected message callbacks remain reactive; global sources do not receive an injection context.
 * Use providers for application- or request-specific configuration in SSR.
 *
 * @example Configure defaults before bootstrapApplication().
 * ```ts
 * configureGlobalFormNodes({
 *   validatorMessages: { required: 'Please complete this field.' },
 *   syncControlInputs: false,
 * });
 * ```
 *
 * @param config Independent global defaults to update.
 * @returns An idempotent cleanup for this call's options. Later overrides remain active;
 * previously cleaned-up overrides are skipped when those later overrides are restored.
 */
export const configureGlobalFormNodes = (config: {
  /** Static or reactive fallback catalog; null clears it. This source is not a DI factory. */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined) | null | undefined;

  /** Default for new control connections; null restores true. Omission preserves the current setting. */
  syncControlInputs?: boolean | null | undefined;

  /** Class map for new bindings; null clears it. Explicit maps replace rather than merge. */
  classes?: Record<string, (binding: FormNodeBinding) => boolean> | null | undefined;
}): (() => void) => {
  const restore: (() => void)[] = [];
  if (config.classes !== undefined) restore.push(classes.configure(config.classes ?? {}));
  if (config.syncControlInputs !== undefined) restore.push(syncControlInputs.configure(config.syncControlInputs ?? true));
  if (config.validatorMessages !== undefined) restore.push(messages.configure(config.validatorMessages ?? {}));
  return () => restore.forEach(cleanup => cleanup());
};
