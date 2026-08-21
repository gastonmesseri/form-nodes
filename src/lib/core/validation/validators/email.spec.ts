import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { email } from './email';

const context = <TValue>(value: TValue) => ({ value: signal(value).asReadonly() });

describe('email', () => {
  it('validates email addresses', () => {
    expect(email(context('david@example.com'))).toBeNull();
    expect(email(context('not-an-email'))).toEqual({ email: true });
    expect(email(context(''))).toBeNull();
    expect(email(context(null))).toBeNull();
  });
});
