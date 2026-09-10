import type { Equal, Expect } from './assert.types';
import { field, group, type ValidationResult } from '../../src/public-api';

const nullCase = group({
  endDate: field<string>(null),
  startDate: field<string>(null, ({ value }): ValidationResult => {
    const endDate = nullCase.endDate();
    return endDate && !value() ? { kind: 'some-error', message: 'something' } : null;
  }),
});
type _nullCase = Expect<Equal<ReturnType<typeof nullCase>, { endDate: string | null; startDate: string | null }>>;

const undefinedCase = group({
  endDate: field<string>(null),
  startDate: field<string>(null, ({ value }): ValidationResult => {
    const endDate = undefinedCase.endDate();
    return endDate && !value() ? { kind: 'some-error', message: 'something' } : undefined;
  }),
});
type _undefinedCase = Expect<Equal<ReturnType<typeof undefinedCase>, { endDate: string | null; startDate: string | null }>>;

const implicitCase = group({
  endDate: field<string>(null),
  startDate: field<string>(null, ({ value }) => {
    const endDate = implicitCase.endDate();
    if (endDate && !value()) return { kind: 'some-error', message: 'something' };
  }),
});
type _implicitCase = Expect<Equal<ReturnType<typeof implicitCase>, { endDate: string | null; startDate: string | null }>>;

// Return annotations preserve both the field values and validation-result checking.
// @ts-expect-error The field accepts dates as strings, not numbers.
nullCase.startDate.set(123);
field<string>(null, ({ value }): ValidationResult => {
  const current: string | null = value();
  // @ts-expect-error Validation errors must have a string kind.
  return { kind: 123, message: current ?? 'Missing date' };
});
