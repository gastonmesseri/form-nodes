import { afterEach, describe, expect, it, vi } from 'vitest';

import { warnInDevMode } from './warn-in-dev-mode';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('warnInDevMode', () => {
  it.each([undefined, true])('warns without an injector when Angular development mode is %s', (mode) => {
    vi.stubGlobal('ngDevMode', mode);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnInDevMode('Diagnostic');
    expect(warn).toHaveBeenCalledExactlyOnceWith('Diagnostic');
  });

  it('does not emit in Angular production mode', () => {
    vi.stubGlobal('ngDevMode', false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    warnInDevMode('Diagnostic');
    expect(warn).not.toHaveBeenCalled();
  });
});
