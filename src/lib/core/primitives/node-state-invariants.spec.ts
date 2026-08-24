import { describe, expect, it } from 'vitest';

import { form } from './form';
import { array } from './array';
import { field } from './field';
import type { Node } from '../types/node.type';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';

type StateFixture = {
  readonly root: Node;
  readonly leaf: Node;
  readonly descendants: readonly Node[];
};

const stateFixtures: readonly [string, () => StateFixture][] = [
  ['field', () => {
    const root = field('', [required], { nullable: false });
    return { root, leaf: root, descendants: [] };
  }],
  ['form', () => {
    const root = form({
      nested: form({
        value: field('', [required], { nullable: false }),
      }),
    });
    return { root, leaf: root.nested.value, descendants: [root.nested, root.nested.value] };
  }],
  ['array', () => {
    const root = array(() => form({
      value: field('', [required], { nullable: false }),
    }), 1);
    const item = root.at(0)!;
    return { root, leaf: item.value, descendants: [item, item.value] };
  }],
];

/**
 * Cross-primitive contract tests for state shared by field(), form(), and array().
 * Primitive-specific suites remain responsible for their distinct value and structural behavior.
 */
describe.each(stateFixtures)('%s shared node-state invariants', (_kind, createFixture) => {
  it('starts interactive and exposes leaf validation through aggregate state', () => {
    const { root, leaf } = createFixture();

    expect(root.api.disabled()).toBe(false);
    expect(root.api.readonly()).toBe(false);
    expect(root.api.hidden()).toBe(false);
    expect(root.api.touched()).toBe(false);
    expect(root.api.dirty()).toBe(false);
    expect(root.api.pending()).toBe(false);
    expect(root.api.invalid()).toBe(true);
    expect(root.api.allErrors()).toEqual([expect.objectContaining({ kind: 'required', targetNode: leaf })]);
  });

  it('changes only its own dirty state through markAsDirty and markAsPristine', () => {
    const { root, descendants } = createFixture();

    root.api.markAsDirty();
    expect(root.api.dirty()).toBe(true);
    descendants.forEach((node) => expect(node.api.dirty()).toBe(false));

    root.api.markAsPristine();
    expect(root.api.dirty()).toBe(false);
  });

  it('marks interactive descendants as touched unless explicitly skipped', () => {
    const { root, descendants } = createFixture();

    root.api.markAsTouched({ skipDescendants: true });
    expect(root.api.touched()).toBe(true);
    descendants.forEach((node) => expect(node.api.touched()).toBe(false));

    root.api.markAsUntouched();
    root.api.markAsTouched();
    expect(root.api.touched()).toBe(true);
    descendants.forEach((node) => expect(node.api.touched()).toBe(true));
  });

  it('inherits disabled state and restores stored interaction and validation state when enabled', () => {
    const { root, leaf, descendants } = createFixture();
    leaf.api.markAsDirty();
    leaf.api.markAsTouched();

    root.api.disable();
    expect(root.api.disabled()).toBe(true);
    descendants.forEach((node) => expect(node.api.disabled()).toBe(true));
    expect(root.api.valid()).toBe(true);
    expect(root.api.invalid()).toBe(false);
    expect(root.api.allErrors()).toEqual([]);
    expect(root.api.dirty()).toBe(false);
    expect(root.api.touched()).toBe(false);

    root.api.enable();
    expect(root.api.disabled()).toBe(false);
    descendants.forEach((node) => expect(node.api.disabled()).toBe(false));
    expect(root.api.invalid()).toBe(true);
    expect(root.api.dirty()).toBe(true);
    expect(root.api.touched()).toBe(true);
  });

  it('inherits readonly and hidden state while preserving stored interaction state', () => {
    const { root, leaf, descendants } = createFixture();
    leaf.api.markAsDirty();
    leaf.api.markAsTouched();

    root.api.markAsReadonly();
    expect(root.api.readonly()).toBe(true);
    descendants.forEach((node) => expect(node.api.readonly()).toBe(true));
    expect(root.api.valid()).toBe(true);
    expect(root.api.dirty()).toBe(false);
    expect(root.api.touched()).toBe(false);

    root.api.markAsWritable();
    expect(root.api.invalid()).toBe(true);
    expect(root.api.dirty()).toBe(true);
    expect(root.api.touched()).toBe(true);

    root.api.hide();
    expect(root.api.hidden()).toBe(true);
    descendants.forEach((node) => expect(node.api.hidden()).toBe(true));
    expect(root.api.valid()).toBe(true);
    expect(root.api.dirty()).toBe(false);
    expect(root.api.touched()).toBe(false);

    root.api.show();
    expect(root.api.invalid()).toBe(true);
    expect(root.api.dirty()).toBe(true);
    expect(root.api.touched()).toBe(true);
  });

  it('reset clears interaction state recursively while preserving and revalidating the current value', () => {
    const { root, leaf, descendants } = createFixture();
    leaf.api.set('valid');
    root.api.markAsTouched();
    leaf.api.markAsDirty();

    root.api.reset();

    expect(root.api.touched()).toBe(false);
    expect(root.api.dirty()).toBe(false);
    descendants.forEach((node) => {
      expect(node.api.touched()).toBe(false);
      expect(node.api.dirty()).toBe(false);
    });
    expect(leaf()).toBe('valid');
    expect(root.api.valid()).toBe(true);
    expect(root.api.allErrors()).toEqual([]);
  });
});

describe.each(stateFixtures.slice(1))('%s aggregate-state invariants', (_kind, createFixture) => {
  it('continues aggregating dirty descendants after its own state is cleared', () => {
    const { root, leaf } = createFixture();

    leaf.api.markAsDirty();
    expect(root.api.dirty()).toBe(true);

    root.api.markAsPristine();
    expect(leaf.api.dirty()).toBe(true);
    expect(root.api.dirty()).toBe(true);

    leaf.api.markAsPristine();
    expect(root.api.dirty()).toBe(false);
  });

  it('continues aggregating touched descendants after its own state is cleared', () => {
    const { root, leaf } = createFixture();

    leaf.api.markAsTouched();
    expect(root.api.touched()).toBe(true);

    root.api.markAsUntouched();
    expect(leaf.api.touched()).toBe(true);
    expect(root.api.touched()).toBe(true);

    leaf.api.markAsUntouched();
    expect(root.api.touched()).toBe(false);
  });
});

describe('shared asynchronous aggregate-state invariants', () => {
  it.each([
    ['field', () => {
      let resolve!: () => void;
      const completion = new Promise<void>((done) => { resolve = done; });
      const root = field('value', [asyncValidator(async () => { await completion; })], { nullable: false });
      return { root: root as Node, resolve };
    }],
    ['form', () => {
      let resolve!: () => void;
      const completion = new Promise<void>((done) => { resolve = done; });
      const root = form({ value: field('value', [asyncValidator(async () => { await completion; })], { nullable: false }) });
      return { root: root as Node, resolve };
    }],
    ['array', () => {
      let resolve!: () => void;
      const completion = new Promise<void>((done) => { resolve = done; });
      const root = array(() => field('value', [asyncValidator(async () => { await completion; })], { nullable: false }), 1);
      return { root: root as Node, resolve };
    }],
  ] as const)('aggregates pending state for %s until descendant validation settles', async (_kind, createFixture) => {
    const { root, resolve } = createFixture();

    expect(root.api.pending()).toBe(true);
    expect(root.api.valid()).toBe(false);
    expect(root.api.invalid()).toBe(false);

    root.api.disable();
    expect(root.api.pending()).toBe(false);
    expect(root.api.valid()).toBe(true);
    root.api.enable();
    expect(root.api.pending()).toBe(true);

    resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(root.api.pending()).toBe(false);
    expect(root.api.valid()).toBe(true);
    expect(root.api.invalid()).toBe(false);
  });
});
