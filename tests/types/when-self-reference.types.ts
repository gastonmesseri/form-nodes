import { computed, type Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { field, form, required, min, max, between, minLength, maxLength, minWords, maxWords, email, url, integer, pattern, minDate, maxDate, dateBetween, oneOf, equalTo, uniqueItems, asyncValidator } from '../../src/public-api';

class Model {
  form = form({
    other: field<number>(23),
    name: field<string>(null, [required({ when: () => this.visible() })]),
    amount: field<number>(0, [min(10, { when: () => this.visible() })]),
    text: field('', [email({ when: () => this.visible() }), url({ when: () => this.visible() }), pattern(/a/, { when: () => this.visible() }), minLength(1, { when: () => this.visible() }), maxLength(5, { when: () => this.visible() }), minWords(1, { when: () => this.visible() }), maxWords(5, { when: () => this.visible() }), equalTo('a', { when: () => this.visible() }), oneOf(['a'], { when: () => this.visible() })]),
    number: field(0, [max(10, { when: () => this.visible() }), between(0, 10, { when: () => this.visible() }), integer({ when: () => this.visible() })]),
    date: field<Date>(null, [minDate('today', { when: () => this.visible() }), maxDate('today', { when: () => this.visible() }), dateBetween('today', 'today', { when: () => this.visible() })]),
    items: field<string[]>([], [uniqueItems({ when: () => this.visible() })]),
    code: field<string>(null, [asyncValidator(async () => null, { when: () => this.visible() })]),
  });

  visible = computed(() => (this.form.other() ?? 0) > 30);
}
const model = new Model();
type _Boolean = Expect<Equal<typeof model.visible, Signal<boolean>>>;
type _Value = Expect<Equal<ReturnType<typeof model.form>, { other: number | null; name: string | null; amount: number | null; code: string | null; text: string | null; number: number | null; date: Date | null; items: string[] | null }>>;
min(1, { when: context => {
  const value: number | null = context.value();
  return value !== null && value > 0;
} });
// @ts-expect-error context-taking conditions must return boolean
min(1, { when: context => 'yes' });
// @ts-expect-error context-taking async conditions must return boolean
asyncValidator(async () => null, { when: context => 'yes' });
// @ts-expect-error field writes retain their types
model.form.amount.set('wrong');

class ParameterizedModel {
  form = form({
    enabled: field.strict(false),
    code: field('', [asyncValidator({
      params: ({ value }) => ({ code: value() }),
      validate: async () => null,
      when: () => this.active(),
    })]),
  });

  active = computed(() => this.form.enabled());
}
type _ParameterizedBoolean = Expect<Equal<ParameterizedModel['active'], Signal<boolean>>>;
