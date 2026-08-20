import { describe, expect, it } from 'vitest';
import { control } from './form-control';
import { form } from './form-group';

describe('signal form primitives', () => {
  it('creates and updates a typed form tree', () => {
    const profile = form({
      name: control('Ada'),
      address: form({ city: control('London') }),
    });

    profile.name.set('Grace');
    profile.address.city.set('Zurich');

    expect(profile()).toEqual({ name: 'Grace', address: { city: 'Zurich' } });
    expect(profile.api.dirty()).toBe(true);
  });

  it('collects validator errors and skips them while disabled', () => {
    const name = control('', [(value) => value ? null : { required: true }]);

    expect(name.errors()).toEqual({ required: true });
    expect(name.invalid()).toBe(true);

    name.disable();
    expect(name.errors()).toBeNull();
    expect(name.valid()).toBe(true);
  });

  it('sets, patches, and resets values', () => {
    const profile = form({ name: control('Ada'), age: control(30) });

    profile.api.patch({ age: 31 });
    expect(profile()).toEqual({ name: 'Ada', age: 31 });

    profile.api.set({ name: 'Grace', age: 32 });
    profile.api.reset({ name: 'Lin', age: 33 });
    expect(profile()).toEqual({ name: 'Lin', age: 33 });
    expect(profile.api.pristine()).toBe(true);
  });
});
