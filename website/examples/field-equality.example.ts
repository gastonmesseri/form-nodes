import { field, form } from 'form-nodes';

const original = { name: 'Marco', preferences: { language: 'en' } };
const profile = form({
  person: field(original, { equal: 'deep' }),
  location: field({ city: 'Zurich' }, { equal: 'shallow' }),
  username: field.strict('Marco', {
    equal: (previous, next) => previous.toLowerCase() === next.toLowerCase(),
  }),
});

const initial = profile();
profile.person.set({ name: 'Marco', preferences: { language: 'en' } });
profile.person(); // { name: 'Marco', preferences: { language: 'en' } }
if (profile.person() !== original || profile() !== initial) {
  throw new Error('Equivalent field values should retain their previous identity and aggregate value.');
}

const location = profile.location();
profile.location.set({ city: 'Zurich' });
if (profile.location() !== location) {
  throw new Error('Shallow equality should retain objects whose direct properties are equal.');
}

profile.username.setControlValue('MARCO');
profile.username(); // 'Marco'
profile.username.controlValue(); // 'MARCO'
if (profile.username() !== 'Marco' || profile.username.controlValue() !== 'MARCO' || !profile.dirty()) {
  throw new Error('Equality should preserve equivalent control input and interaction state.');
}

profile.username.reset();
profile.username(); // 'Marco': equality retains the exposed value
profile.username.controlValue(); // 'MARCO': reset preserves the latest committed write
if (profile.username() !== 'Marco' || profile.username.controlValue() !== 'MARCO' || profile.dirty()) {
  throw new Error('Reset should preserve the latest internal value in the control and clear interaction.');
}

profile.username.update(value => `${value}!`);
profile.username(); // 'Marco!': update receives the exposed value
if (profile.username() !== 'Marco!') {
  throw new Error('Update should receive the same exposed value that consumers read.');
}
