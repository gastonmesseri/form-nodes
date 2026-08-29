// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';

import { nativeInputRequiresValidityTracking, watchNativeInputValidity } from './native-input-validity';

class TestAnimationEvent extends Event {
  constructor(type: string, readonly animationName: string) { super(type); }
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.textContent = '';
});

describe('native input validity tracking', () => {
  it('tracks only date-like input types', () => {
    const input = document.createElement('input');
    for (const type of ['date', 'datetime-local', 'month', 'time', 'week']) {
      input.type = type;
      expect(nativeInputRequiresValidityTracking(input)).toBe(true);
    }
    input.type = 'number';
    expect(nativeInputRequiresValidityTracking(input)).toBe(false);
  });

  it('is inert when animation events are unavailable', () => {
    vi.stubGlobal('AnimationEvent', undefined);
    const input = document.createElement('input');
    const callback = vi.fn();

    const cleanup = watchNativeInputValidity(input, callback);
    cleanup();

    expect(callback).not.toHaveBeenCalled();
  });

  it('deduplicates document styles, filters events, and cleans up idempotently', () => {
    vi.stubGlobal('AnimationEvent', TestAnimationEvent);
    const first = document.createElement('input');
    const second = document.createElement('input');
    document.body.append(first, second);
    const callback = vi.fn();
    const stylesBefore = document.head.querySelectorAll('style').length;

    const stopFirst = watchNativeInputValidity(first, callback, 'test-nonce');
    const stopSecond = watchNativeInputValidity(second, callback);
    expect(document.head.querySelectorAll('style')).toHaveLength(stylesBefore + 1);
    expect((document.head.querySelector('style:last-of-type') as HTMLStyleElement | null)?.nonce).toBe('test-nonce');

    first.dispatchEvent(new TestAnimationEvent('animationstart', 'unrelated'));
    first.dispatchEvent(new TestAnimationEvent('animationstart', 'form-node-invalid'));
    second.dispatchEvent(new TestAnimationEvent('animationstart', 'form-node-valid'));
    expect(callback).toHaveBeenCalledTimes(2);

    stopFirst();
    stopFirst();
    expect(document.head.querySelectorAll('style')).toHaveLength(stylesBefore + 1);
    stopSecond();
    expect(document.head.querySelectorAll('style')).toHaveLength(stylesBefore);
  });

  it('owns validity styles independently inside Shadow DOM', () => {
    vi.stubGlobal('AnimationEvent', TestAnimationEvent);
    const firstHost = document.createElement('div');
    const secondHost = document.createElement('div');
    const firstRoot = firstHost.attachShadow({ mode: 'open' });
    const secondRoot = secondHost.attachShadow({ mode: 'open' });
    const first = document.createElement('input');
    const second = document.createElement('input');
    firstRoot.append(first);
    secondRoot.append(second);
    document.body.append(firstHost, secondHost);

    const stopFirst = watchNativeInputValidity(first, () => {});
    const stopSecond = watchNativeInputValidity(second, () => {});
    expect(firstRoot.querySelectorAll('style')).toHaveLength(1);
    expect(secondRoot.querySelectorAll('style')).toHaveLength(1);

    stopFirst();
    stopSecond();
    expect(firstRoot.querySelectorAll('style')).toHaveLength(0);
    expect(secondRoot.querySelectorAll('style')).toHaveLength(0);
  });
});
