import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import { requiredIf } from './required-if';
import { field } from '../../primitives/field';

describe('requiredIf', () => {
  it('reactively requires the value and exposes matching metadata', () => {
    const enabled = signal(false);
    const condition = vi.fn(() => enabled());
    const name = field('', [requiredIf(condition)]);

    expect(name.errors()).toEqual([]);
    expect(name.required()).toBe(false);

    enabled.set(true);

    expect(name.errors()).toMatchObject([{ kind: 'required' }]);
    expect(name.required()).toBe(true);

    name.set('Gem');

    expect(name.errors()).toEqual([]);
    expect(name.required()).toBe(true);

    enabled.set(false);

    expect(name.required()).toBe(false);
    expect(condition).toHaveBeenCalled();
  });

  it('supports static and reactive custom messages', () => {
    const message = signal('Enter a name.');
    const staticMessage = field('', [requiredIf(() => true, 'Required now.')]);
    const reactiveMessage = field('', [requiredIf(() => true, { message: () => message() })]);

    expect(staticMessage.getError('required')?.message).toBe('Required now.');
    expect(reactiveMessage.getError('required')?.message).toBe('Enter a name.');

    message.set('Still required.');

    expect(reactiveMessage.getError('required')?.message).toBe('Still required.');
  });
});
