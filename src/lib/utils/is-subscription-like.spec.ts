import { describe, expect, it, vi } from 'vitest';

import { isSubscriptionLike } from './is-subscription-like';

describe('isSubscriptionLike', () => {
  it('recognizes a subscription without unsubscribing it', () => {
    const unsubscribe = vi.fn();

    expect(isSubscriptionLike({ unsubscribe })).toBe(true);
    expect(unsubscribe).not.toHaveBeenCalled();
  });

  it('accepts subscription methods inherited from a class', () => {
    class Subscription {
      unsubscribe() {}
    }

    expect(isSubscriptionLike(new Subscription())).toBe(true);
  });

  it.each([null, undefined, false, 0, 'unsubscribe', {}, { unsubscribe: true }, { unsubscribe: null }, () => {}])(
    'rejects a value without a subscription method: %j',
    (value) => {
      expect(isSubscriptionLike(value)).toBe(false);
    },
  );
});
