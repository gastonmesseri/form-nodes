import { field, form } from '@gem/ng-forms';

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
if (profile.username.controlValue() !== 'Marco' || profile.dirty()) {
  throw new Error('Reset should restore the committed value to the control and clear interaction.');
}
