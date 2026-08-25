import { describe, expect, it } from 'vitest';
import { resolveForwardRef } from '@angular/core';

import { FORM_NODE_CONTROL, provideFormNodeControl } from './form-node-control';

describe('provideFormNodeControl', () => {
  it('provides the lazily referenced host control through the public token', () => {
    class Control {}
    const provider = provideFormNodeControl(() => Control);
    expect(provider.provide).toBe(FORM_NODE_CONTROL);
    expect(resolveForwardRef(provider.useExisting)).toBe(Control);
  });
});
