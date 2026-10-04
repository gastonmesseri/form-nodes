import { describe, expect, it } from 'vitest';
import { computed, signal, type WritableSignal } from '@angular/core';

import { isWritableControlSignal } from './is-writable-control-signal';

describe('isWritableControlSignal', () => {
  it('accepts writable Angular signals without requiring update', () => {
    const value = signal('initial');
    expect(isWritableControlSignal(value)).toBe(true);
    delete (value as Partial<WritableSignal<string>>).update;
    expect(isWritableControlSignal(value)).toBe(true);
  });

  it('rejects readonly signals and signals without a callable writer', () => {
    expect(isWritableControlSignal(signal('initial').asReadonly())).toBe(false);
    expect(isWritableControlSignal(computed(() => 'readonly'))).toBe(false);
    const malformed = Object.assign(signal('initial'), { set: true });
    expect(isWritableControlSignal(malformed)).toBe(false);
  });

  it('rejects non-signal values even when they have set', () => {
    expect(isWritableControlSignal(null)).toBe(false);
    expect(isWritableControlSignal({ set: () => {} })).toBe(false);
    expect(isWritableControlSignal(Object.assign(() => 'value', { set: () => {} }))).toBe(false);
  });
});
