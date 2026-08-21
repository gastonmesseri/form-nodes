import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { FieldContext } from '../validation/validation.type';
import { isFieldContext, markAsFieldContext } from './field-context-marker';

describe('field context marker', () => {
  it('recognizes only marked contexts without adding an enumerable property', () => {
    const context: FieldContext<string> = { value: signal('David').asReadonly() };
    expect(isFieldContext(context)).toBe(false);
    expect(isFieldContext(markAsFieldContext(context))).toBe(true);
    expect(Object.keys(context)).toEqual(['value']);
    expect(Object.getOwnPropertySymbols(context)).toHaveLength(1);
  });
});
