import { field, form } from '@ngblocks/form-nodes';

const name = field('Declared name');
name.set('Changed before attachment');

const profile = form({ name });
const nickname = profile.add('nickname', field('Initial nickname'));
profile.add('temporary', field('Temporary field'));
profile.remove('temporary');
nickname.set('Edited nickname');
profile.resetToInitial();

profile(); // { name: 'Declared name', nickname: 'Initial nickname' }
if (profile.name() !== 'Declared name' || nickname() !== 'Initial nickname' || profile.get('temporary') !== undefined) {
  throw new Error('Restoration should keep the current schema and each existing field baseline.');
}
