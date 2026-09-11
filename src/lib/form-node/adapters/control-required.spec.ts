import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { controlRequired } from './control-required';
import { field, required, requiredTrue, notNil } from '../../../public-api';

describe('control required constraints', () => {
  it('distinguishes presence from acceptance independently of current validity', () => {
    const answer = field<boolean>(null, [required]);
    expect(controlRequired(answer, false)).toBe(true);
    expect(controlRequired(answer, true)).toBe(false);
    answer.set(false);
    expect(answer.valid()).toBe(true);
    expect(controlRequired(answer, true)).toBe(false);
    const acceptance = field(true, [requiredTrue, requiredTrue('Accept the terms.')]);
    expect(controlRequired(acceptance, true)).toBe(true);
    expect(controlRequired(acceptance, false)).toBe(true);
    acceptance.disable();
    expect(controlRequired(acceptance, true)).toBe(true);
    const reference = field(null, [notNil]);
    expect(reference.invalid()).toBe(true);
    expect(controlRequired(reference, true)).toBe(false);
    expect(controlRequired(reference, false)).toBe(false);
  });

  it('tracks conditional metadata, custom errors, and validator replacement', () => {
    const enabled = signal(true);
    const acceptance = field(false, [requiredTrue({ when: () => enabled(), error: { kind: 'consent' } })]);
    expect(controlRequired(acceptance, true)).toBe(true);
    enabled.set(false);
    expect(controlRequired(acceptance, true)).toBe(false);
    acceptance.setValidators(() => ({ kind: 'requiredTrue' }));
    expect(controlRequired(acceptance, true)).toBe(true);
    acceptance.setValidators(() => ({ kind: 'other' }));
    expect(controlRequired(acceptance, true)).toBe(false);
    acceptance.setValidators([]);
    expect(controlRequired(acceptance, false)).toBe(false);
  });
});
