import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { field } from '../primitives/field';
import { readExternalValidationErrors, registerExternalValidationErrors } from './external-validation-errors';

describe('external validation errors', () => {
  it('combines reactive sources in registration order and supplies the default target node', () => {
    const name = field('David');
    const first = signal<readonly { kind: string }[]>([{ kind: 'first' }]);
    const second = signal<readonly { kind: string }[]>([{ kind: 'second' }]);

    registerExternalValidationErrors(name, {}, first);
    registerExternalValidationErrors(name, {}, second);

    expect(readExternalValidationErrors(name)).toEqual([
      { kind: 'first', targetNode: name },
      { kind: 'second', targetNode: name },
    ]);

    first.set([{ kind: 'updated' }]);
    expect(readExternalValidationErrors(name)).toEqual([
      { kind: 'updated', targetNode: name },
      { kind: 'second', targetNode: name },
    ]);
  });

  it('preserves an explicitly targeted error without mutating its source object', () => {
    const name = field('David');
    const other = field('Mark');
    const error = { kind: 'other', targetNode: other };

    registerExternalValidationErrors(name, {}, signal([error]));

    expect(readExternalValidationErrors(name)).toEqual([{ kind: 'other', targetNode: other }]);
    expect(error).toEqual({ kind: 'other', targetNode: other });
  });

  it('removes a source through an idempotent cleanup', () => {
    const name = field('David');
    const cleanup = registerExternalValidationErrors(name, {}, signal([{ kind: 'temporary' }]));

    cleanup();
    cleanup();

    expect(readExternalValidationErrors(name)).toEqual([]);
  });

  it('does not let stale cleanup remove a newer source registered by the same owner', () => {
    const name = field('David');
    const owner = {};
    const cleanupFirst = registerExternalValidationErrors(name, owner, signal([{ kind: 'first' }]));
    const cleanupSecond = registerExternalValidationErrors(name, owner, signal([{ kind: 'second' }]));

    cleanupFirst();
    expect(readExternalValidationErrors(name)).toEqual([{ kind: 'second', targetNode: name }]);

    cleanupSecond();
    expect(readExternalValidationErrors(name)).toEqual([]);
  });
});
