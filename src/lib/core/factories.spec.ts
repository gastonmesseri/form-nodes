import { describe, expect, it } from 'vitest';
import { array, field, form, group } from './factories';

describe('form factories', () => {
  it('creates and updates a typed form tree', () => {
    const profile = form({
      name: field('Ada'),
      tags: array([field('engineer')]),
      address: group({ city: field('London') }),
    });

    profile.controls.name.setValue('Grace');

    expect(profile.value()).toEqual({
      name: 'Grace',
      tags: ['engineer'],
      address: { city: 'London' },
    });
  });

  it('collects validator errors', () => {
    const name = field('', [(value) => (value ? null : 'Name is required')]);

    expect(name.status()).toBe('invalid');
    expect(name.errors()).toEqual(['Name is required']);
  });
});
