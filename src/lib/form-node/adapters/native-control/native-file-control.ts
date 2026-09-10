import { isNil } from '../../../utils/is-nil';

/** Synchronizes files already owned by the application without assigning a filesystem path. */
export const writeNativeFiles = (input: HTMLInputElement, value: unknown) => {
  // Server DOM implementations cannot represent a browser file selection.
  const selected = input.files;
  if (!selected) return;

  if (!isNil(value) && Array.isArray(value) !== input.multiple) {
    throw new Error(`formNode: a file input requires ${input.multiple ? 'File[]' : 'File'} or a nullish value`);
  }
  const files: File[] = isNil(value) ? [] : Array.isArray(value) ? value : [value as File];
  if (files.length === 0) {
    input.value = '';
    return;
  }
  if (selected.length === files.length && files.every((file, index) => selected.item(index) === file)) return;

  const Transfer = input.ownerDocument.defaultView?.DataTransfer;
  if (!Transfer) {
    throw new Error('formNode: updating a file selection requires browser DataTransfer support');
  }
  const transfer = new Transfer();
  files.forEach(file => transfer.items.add(file));
  input.files = transfer.files;
};
