import assert from 'node:assert/strict';
import { computed } from '@angular/core';
import { field, form } from '@ngblocks/form-nodes';

const upload = form({
  attachment: field<File>(null),
});
const filename = computed(() => upload.attachment()?.name ?? 'No file selected');
assert.equal(filename(), 'No file selected');

const report = new File(['Quarterly report'], 'report.txt', { type: 'text/plain' });
upload.attachment.set(report);
upload.attachment()?.name; // 'report.txt'
upload.attachment()?.size; // 16
assert.equal(filename(), 'report.txt');
assert.equal(upload.attachment()?.size, 16);
assert.equal(upload.attachment(), report);

// Send this payload with your application's HTTP client when ready to upload.
const payload = new FormData();
const attachment = upload.attachment();
if (attachment) payload.append('attachment', attachment);
assert.equal((payload.get('attachment') as File).name, 'report.txt');

upload.resetToInitial();
upload.attachment(); // null
assert.equal(upload.attachment(), null);
assert.equal(filename(), 'No file selected');
