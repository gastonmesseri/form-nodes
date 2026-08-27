import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { email } from './email';

const context = <TValue>(value: TValue) => ({ value: signal(value).asReadonly() });

describe('email', () => {
  it('validates email addresses', () => {
    expect(email({})(context('david@example.com'))).toBeNull();
    expect(email({})(context('not-an-email'))).toEqual({
      kind: 'email',
      message: 'Please enter a valid email address.',
    });
    expect(email({ message: 'Invalid email' })(context('not-an-email'))).toEqual({
      kind: 'email',
      message: 'Invalid email',
    });
    expect(email({})(context(''))).toBeNull();
    expect(email({})(context(null))).toBeNull();
  });
});
