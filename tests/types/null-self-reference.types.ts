import type { Equal, Expect } from './assert.types';
import { array, createFormPrimitives, field, form, group, validator, type ValidationResult } from '../../src/public-api';

const nullCase = group({
  endDate: field<string>(null),
  startDate: field<string>(null, ({ value }) => {
    const endDate = nullCase.endDate();
    return endDate && !value() ? { kind: 'some-error', message: 'something' } : null;
  }),
});
type _nullCase = Expect<Equal<ReturnType<typeof nullCase>, { endDate: string | null; startDate: string | null }>>;

const undefinedCase = group({
  endDate: field<string>(null),
  startDate: field<string>(null, ({ value }) => {
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

// Unannotated declaration callbacks preserve field types; explicit results remain checked.
// @ts-expect-error The field accepts dates as strings, not numbers.
nullCase.startDate.set(123);
field<string>(null, ({ value }): ValidationResult => {
  const current: string | null = value();
  // @ts-expect-error Validation errors must have a string or numeric kind.
  return { kind: false, message: current ?? 'Missing date' };
});

class DateEditor {
  dates = group({
    end: field<string>(null),
    start: field<string>(null, [({ value, node }) => {
      type _ContextValue = Expect<Equal<ReturnType<typeof value>, string | null>>;
      type _NodeValue = Expect<Equal<ReturnType<ReturnType<typeof node>>, string | null>>;
      return this.dates.end() && !value() ? { kind: 123 } : null;
    }]),
    alternative: field<string>(null, { validators: ({ value }) => this.dates.end() && !value() ? { kind: 456 } : undefined }),
  });
}
const editor = new DateEditor();
type _ClassModel = Expect<Equal<ReturnType<typeof editor.dates>, { end: string | null; start: string | null; alternative: string | null }>>;
// @ts-expect-error Unknown sibling names remain errors.
editor.dates.missing();
const numericResult: ValidationResult = { kind: 123, message: 'Numeric input kind' };
field('', (): ValidationResult => numericResult);

const configured = createFormPrimitives({ nullable: false });
class DeclarationForms {
  root = form({ name: field('') }, ({ value }) => this.root.name() && !value().name ? { kind: 'missing' } : null);

  branch = group({ name: field('') }, { validators: ({ value }) => this.branch.name() && !value().name ? { kind: 'missing' } : undefined });

  rows = array(field(''), [], ({ value }) => this.rows().length && !value().length ? { kind: 'missing' } : null);

  model = configured.form({
    end: configured.field(''),
    start: configured.field('', ({ value }) => this.model.end() && !value() ? { kind: 'missing' } : null),
    strict: field.strict('', ({ value }) => this.model.end() && !value() ? { kind: 'missing' } : null),
    nullable: field.nullable<string>(null, ({ value }) => this.model.end() && !value() ? { kind: 'missing' } : null),
  });
}
const declarations = new DeclarationForms();
type _Root = Expect<Equal<ReturnType<typeof declarations.root>, { name: string | null }>>;
type _Branch = Expect<Equal<ReturnType<typeof declarations.branch>, { name: string | null }>>;
type _Rows = Expect<Equal<ReturnType<typeof declarations.rows>, (string | null)[]>>;
type _Configured = Expect<Equal<ReturnType<typeof declarations.model>, { end: string; start: string; strict: string; nullable: string | null }>>;
const checkedNumeric = validator<string | null>(({ value }) => value() ? null : { kind: 123 });
field('', checkedNumeric);
// @ts-expect-error Checked helpers still reject unsupported kind types.
validator<string | null>(({ value }) => ({ kind: false, message: value() ?? '' }));
