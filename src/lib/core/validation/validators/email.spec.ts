import { describe, expect, it } from 'vitest';

import { email } from './email';

describe('email', () => {
  it('validates email addresses', () => {
    expect(email('david@example.com')).toBeNull();
    expect(email('not-an-email')).toEqual({ email: true });
    expect(email('')).toBeNull();
    expect(email(null)).toBeNull();
  });
});
