import { afterEach, describe, expect, it, vi } from 'vitest';

import { normalizeValidationResult } from './normalize-validation-result';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('normalizeValidationResult', () => {
  it('preserves error identity, order, duplicate kinds, and empty-string kinds', () => {
    const first = { kind: '', message: 'First', extra: 1 };
    const second = { kind: '', message: 'Second' };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeValidationResult([null, first, undefined, second])).toEqual([first, second]);
    expect(normalizeValidationResult(first)[0]).toBe(first);
    expect(normalizeValidationResult(null)).toEqual([]);
    expect(normalizeValidationResult(undefined)).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([{}, { kind: 0 }, { kind: null }, { kind: undefined }, 42, false, Symbol('invalid'), [[]]])('ignores malformed result %s and warns in development', (result) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeValidationResult(result)).toEqual([]);
    expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('string "kind" property'));
  });

  it('normalizes messages without trimming, deduplicating, or changing structured errors', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const structured = { kind: 'custom', message: 'Structured', extra: 1 };
    expect(normalizeValidationResult('')).toEqual([{ kind: 'custom', message: '' }]);
    const errors = normalizeValidationResult(['First', structured, 'First', '  ', {}, null]);
    expect(errors).toEqual([
      { kind: 'custom', message: 'First' },
      structured,
      { kind: 'custom', message: 'First' },
      { kind: 'custom', message: '  ' },
    ]);
    expect(errors[1]).toBe(structured);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('ignores an object whose kind getter throws and preserves the other errors', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = { get kind() { throw new Error('Unreadable property'); } };
    const valid = { kind: 'valid' };
    expect(normalizeValidationResult([valid, result, {}])).toEqual([valid]);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('does not warn in production while still ignoring malformed results', () => {
    vi.stubGlobal('ngDevMode', false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(normalizeValidationResult([{}, { kind: 'valid' }])).toEqual([{ kind: 'valid' }]);
    expect(warn).not.toHaveBeenCalled();
  });
});
