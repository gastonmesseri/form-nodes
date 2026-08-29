import { field, form } from '@gem/ng-forms';

const searchForm = form({
  query: field('', {
    debounce: 'blur',
  }),
});

searchForm.query.setControlValue('angular signals');

if (searchForm.query.controlValue() !== 'angular signals') {
  throw new Error('The control value should update immediately.');
}
if (searchForm.query() !== '' || !searchForm.query.debouncing()) {
  throw new Error('The committed value should wait while blur debounce is active.');
}
if (!searchForm.query.dirty() || searchForm.query.touched()) {
  throw new Error('Control input should mark dirty without marking touched.');
}

searchForm.query.markAsTouched();

if (searchForm.query() !== 'angular signals' || searchForm.query.debouncing()) {
  throw new Error('Touch should commit the pending control value.');
}
if (!searchForm.query.touched()) {
  throw new Error('The field should be touched after the blur-equivalent action.');
}
