import { field, form } from '@ngblocks/form-nodes';

const myForm = form({
  name: field('', () => ({ message: 'Missing kind' })),
});

myForm.valid(); // true; the malformed result is ignored, with a development warning
if (!myForm.valid()) throw new Error('Malformed results must not block the form.');

myForm.name.setValidators(() => [{ kind: 'custom' }, {}]);
myForm.name.errors().length; // 1; only the valid error is kept
if (myForm.name.errors().length !== 1 || !myForm.name.hasError('custom')) {
  throw new Error('Valid errors must survive filtering.');
}
