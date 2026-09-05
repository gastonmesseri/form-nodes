import { afterEach, describe, expect, it } from 'vitest';
import { InjectionToken, Injector, createEnvironmentInjector, inject, runInInjectionContext, signal, type Signal } from '@angular/core';

import { min } from './validators/min';
import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { required } from './validators/required';
import { configureGlobalValidatorMessages, provideValidatorMessages } from './validator-messages';

describe('validator messages', () => {
  const restoreConfigurations: (() => void)[] = [];

  afterEach(() => {
    restoreConfigurations.splice(0).reverse().forEach(restore => restore());
  });

  it('resolves reactive messages by local, form, provider, global, and built-in precedence', () => {
    const language = signal<'en' | 'es'>('en');
    const restore = configureGlobalValidatorMessages(() => ({
      required: () => `global:${language()}`,
    }));
    restoreConfigurations.push(restore);
    const globalField = field('', [required]);

    const LANGUAGE = new InjectionToken<Signal<'en' | 'es'>>('Language');
    const injector = createEnvironmentInjector([
      { provide: LANGUAGE, useValue: language.asReadonly() },
      provideValidatorMessages(() => {
        const currentLanguage = inject(LANGUAGE);
        return { required: () => `provider:${currentLanguage()}` };
      }),
    ], Injector.NULL as never);

    try {
      const providerField = runInInjectionContext(injector, () => field('', [required]));
      const profile = runInInjectionContext(injector, () => form({
        inherited: field('', [required]),
        local: field('', [required({ message: () => `local:${language()}` })]),
      }, {
        validatorMessages: () => ({ required: () => `form:${language()}` }),
      }));

      expect(globalField.getError('required')?.message).toBe('global:en');
      expect(providerField.getError('required')?.message).toBe('provider:en');
      expect(profile.inherited.getError('required')?.message).toBe('form:en');
      expect(profile.local.getError('required')?.message).toBe('local:en');

      language.set('es');

      expect(globalField.getError('required')?.message).toBe('global:es');
      expect(providerField.getError('required')?.message).toBe('provider:es');
      expect(profile.inherited.getError('required')?.message).toBe('form:es');
      expect(profile.local.getError('required')?.message).toBe('local:es');

      restore();
      restoreConfigurations.pop();
      expect(globalField.getError('required')?.message).toBe('This field is required.');
    } finally {
      injector.destroy();
    }
  });

  it('passes structured constraint parameters to configured messages', () => {
    const restore = configureGlobalValidatorMessages({
      min: ({ min, actual }) => `${actual} must be at least ${min}`,
    });
    restoreConfigurations.push(restore);
    const age = field(16, [min(18)]);

    expect(age.getError('min')?.message).toBe('16 must be at least 18');
  });
});
