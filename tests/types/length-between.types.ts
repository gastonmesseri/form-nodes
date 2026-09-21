import { signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { array, field, form, lengthBetween } from '../../src/public-api';

const minimum = signal<number | undefined>(1);
const maximum = signal<number | undefined>(5);
const profile = form({
  username: field('', lengthBetween(1, 5)),
  nickname: field<string>(undefined, [lengthBetween(minimum, maximum)]),
  members: array({ name: field('') }, { validators: lengthBetween(1, 5) }),
  tags: field<readonly string[]>([], [lengthBetween(1, 5, 'Choose one to five tags')]),
  choices: field(new Set<string>(), [lengthBetween(1, 5, { message: () => 'Choose one to five items' })]),
  entries: field(new Map<string, number>(), [lengthBetween(1, 5)]),
});
type _Username = Expect<Equal<ReturnType<typeof profile.username>, string>>;
type _Nickname = Expect<Equal<ReturnType<typeof profile.nickname>, string | undefined>>;
const minimumError = profile.username.getError('minLength');
type _Minimum = Expect<Equal<NonNullable<typeof minimumError>['minLength'], number>>;
const maximumError = profile.username.getError('maxLength');
type _Maximum = Expect<Equal<NonNullable<typeof maximumError>['maxLength'], number>>;

lengthBetween(1, 5, {
  when: ({ value }) => value() !== null,
  error: ({ value }) => ({ kind: 'customLength', actual: value() }),
});

class Editor {
  profile = form({
    enabled: field(true),
    username: field('', [lengthBetween(1, 5, { when: () => this.profile.enabled() })]),
  });
}
new Editor();

// @ts-expect-error Numeric values do not have a length or size.
field(5, [lengthBetween(1, 5)]);
// @ts-expect-error Bounds must be numbers or reactive numeric sources.
lengthBetween('1', 5);
// @ts-expect-error A replacement error and message cannot be configured together.
lengthBetween(1, 5, { message: 'Length', error: { kind: 'length' } });
// @ts-expect-error Context-taking predicates must return a boolean.
lengthBetween(1, 5, { when: ({ value }) => value() });
