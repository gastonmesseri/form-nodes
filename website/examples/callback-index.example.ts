import { array, field, form } from '@ngblocks/form-nodes';

const changes: Array<{ index: number | null; code: string | null }> = [];
const profile = form({
  rows: array({
    code: field(''),
    details: {
      email: field('', {
        disabled: ({ index }) => index === 0,
        onValueChange(_value, _node, { index }) {
          changes.push({
            index,
            code: index === null ? null : profile.rows[index]!.code(),
          });
        },
      }),
    },
  }, { initialValue: [{ code: 'A', details: { email: '' } }, { code: 'B', details: { email: '' } }] }),
});

const firstEmail = profile.rows[0]!.details.email;
if (!firstEmail.disabled()) throw new Error('The first email must be disabled.');
firstEmail.set('ada@example.com');
if (changes[0]?.index !== 0 || changes[0]?.code !== 'A') throw new Error('The first row index must be available.');

profile.rows.move(0, 1);
if (firstEmail.disabled()) throw new Error('Availability must follow the current row position.');
firstEmail.set('grace@example.com');
if (changes[1]?.index !== 1 || changes[1]?.code !== 'A') {
  throw new Error('Value callbacks must see the current row position.');
}
