import { field, form } from '@ngblocks/form-nodes';

const myForm = form({
  name: field('admin', ({ value }) => value() === 'admin' ? 'Choose another name' : null),
});

myForm.name.getError('custom')?.message; // 'Choose another name'
if (myForm.valid() || myForm.name.getError('custom')?.message !== 'Choose another name') {
  throw new Error('A message must become a custom validation error.');
}

myForm.name.set('Alex');
myForm.valid(); // true
if (!myForm.valid() || myForm.allErrors().length !== 0) {
  throw new Error('Returning null must clear the error.');
}
