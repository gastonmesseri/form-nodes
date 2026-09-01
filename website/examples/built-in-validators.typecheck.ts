import { between, dateBetween, email, equalTo, field, form, integer, max, maxDate, maxLength, maxWords, min, minDate, minLength, minWords, oneOf, pattern, required, uniqueItems, url } from '@gem/ng-forms';

const password = field('');

const myForm = form({
  name: field('', [required, minLength(2), maxLength(80)]),
  biography: field('', [minWords(2), maxWords(200)]),
  age: field<number>(null, [integer, min(18), max(120), between(18, 120)]),
  email: field('', [email]),
  website: field('', [url]),
  role: field('', [oneOf(['admin', 'editor', 'viewer'])]),
  code: field('', [pattern(/^[A-Z]{3}$/)]),
  startDate: field<Date>(null, [minDate('2026-01-01'), maxDate('2026-12-31')]),
  eventDate: field<Date>(null, [dateBetween('2026-01-01', '2026-12-31')]),
  password,
  confirmation: field('', [equalTo(() => password())]),
  tags: field<string[]>([], [uniqueItems]),
});

void myForm;
