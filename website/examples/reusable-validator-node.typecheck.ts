import { field, form, validator } from '@gem/ng-forms';

const notBlank = validator<string | null>((ctx) => {
  const node = ctx.field();
  const currentValue = node.value();
  const typedValue: string | null = currentValue;
  // @ts-expect-error The declared value type cannot be assigned to a number.
  const numericValue: number = currentValue;
  void numericValue;

  return typedValue?.trim() ? null : { kind: 'blankName' };
});

const profile = form({
  name: field('', [notBlank]),
});

void profile;
