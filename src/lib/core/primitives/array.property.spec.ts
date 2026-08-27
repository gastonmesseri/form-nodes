import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { array } from './array';
import { field } from './field';

/**
 * Property-based tests for the public `array()` API.
 *
 * Unlike the example-oriented cases in `array.spec.ts`, this suite uses `fast-check` to
 * generate many mutation sequences and complete value snapshots. Every generated step is
 * compared with a simple in-memory model and checked against structural node invariants.
 *
 * The mutation property covers `push`, `insert`, `removeAt`, `move`, `set`, `update`, and
 * `clear`, including node identity, numeric access, iteration, parent/path updates, and
 * detachment. The reconciliation property covers stable `trackBy` identity across arbitrary
 * insertions, removals, updates, and reorderings, including preservation of interaction state.
 *
 * `fast-check` automatically shrinks a failure to a smaller counterexample and reports the
 * seed and path required to reproduce it. Keep these tests in this dedicated sibling file so
 * `array.spec.ts` remains focused on explicit user-facing examples and regression cases.
 */

type Operation =
  | { readonly kind: 'push'; readonly value: string }
  | { readonly kind: 'insert'; readonly index: number; readonly value: string }
  | { readonly kind: 'remove'; readonly index: number }
  | { readonly kind: 'move'; readonly from: number; readonly to: number }
  | { readonly kind: 'set'; readonly values: readonly string[] }
  | { readonly kind: 'update'; readonly value: string }
  | { readonly kind: 'clear' };

const valueArbitrary = fc.string({ maxLength: 12 });
const indexArbitrary = fc.integer({ min: -1000, max: 1000 });
const operationArbitrary: fc.Arbitrary<Operation> = fc.oneof(
  fc.record({ kind: fc.constant<'push'>('push'), value: valueArbitrary }),
  fc.record({ kind: fc.constant<'insert'>('insert'), index: indexArbitrary, value: valueArbitrary }),
  fc.record({ kind: fc.constant<'remove'>('remove'), index: indexArbitrary }),
  fc.record({ kind: fc.constant<'move'>('move'), from: indexArbitrary, to: indexArbitrary }),
  fc.record({ kind: fc.constant<'set'>('set'), values: fc.array(valueArbitrary, { maxLength: 12 }) }),
  fc.record({ kind: fc.constant<'update'>('update'), value: valueArbitrary }),
  fc.record({ kind: fc.constant<'clear'>('clear') }),
);

const normalizedIndex = (index: number, length: number): number =>
  ((index % length) + length) % length;

describe('array property-based invariants', () => {
  it('preserves structural invariants across arbitrary mutation sequences', () => {
    fc.assert(fc.property(
      fc.array(operationArbitrary, { minLength: 1, maxLength: 75 }),
      (operations) => {
        const names = array(field('', { nullable: false }));
        let model: string[] = [];

        const expectInvariants = () => {
          const items = names.items();
          expect(names()).toEqual(model);
          expect(names.length()).toBe(model.length);
          expect([...names]).toEqual(items);
          expect(new Set(items).size).toBe(items.length);
          items.forEach((item, index) => {
            expect(names[index]).toBe(item);
            expect(item()).toBe(model[index]);
            expect(item.parent()).toBe(names);
            expect(item.path()).toEqual([String(index)]);
          });
        };

        operations.forEach((operation) => {
          if (operation.kind === 'push') {
            const item = names.push(operation.value);
            model.push(operation.value);
            expect(names[model.length - 1]).toBe(item);
          } else if (operation.kind === 'insert') {
            const index = normalizedIndex(operation.index, model.length + 1);
            const item = names.insert(index, operation.value);
            model.splice(index, 0, operation.value);
            expect(names[index]).toBe(item);
          } else if (operation.kind === 'remove') {
            if (model.length === 0) {
              expect(names.removeAt(operation.index)).toBeUndefined();
            } else {
              const index = normalizedIndex(operation.index, model.length);
              const removed = names.removeAt(index)!;
              model.splice(index, 1);
              expect(removed.parent()).toBeNull();
              expect(removed.path()).toEqual([]);
            }
          } else if (operation.kind === 'move' && model.length > 0) {
            const from = normalizedIndex(operation.from, model.length);
            const to = normalizedIndex(operation.to, model.length);
            const item = names[from]!;
            names.move(from, to);
            const [value] = model.splice(from, 1);
            model.splice(to, 0, value!);
            expect(names[to]).toBe(item);
          } else if (operation.kind === 'set') {
            const previous = [...names];
            names.set(operation.values);
            model = [...operation.values];
            previous.slice(model.length).forEach((item) => {
              expect(item.parent()).toBeNull();
              expect(item.path()).toEqual([]);
            });
            previous.slice(0, model.length).forEach((item, index) => {
              expect(names[index]).toBe(item);
            });
          } else if (operation.kind === 'update') {
            names.update(values => [...values, operation.value]);
            model.push(operation.value);
          } else if (operation.kind === 'clear') {
            const previous = [...names];
            names.clear();
            model = [];
            previous.forEach((item) => {
              expect(item.parent()).toBeNull();
              expect(item.path()).toEqual([]);
            });
          }
          expectInvariants();
        });
      },
    ), { numRuns: 100 });
  });

  it('reconciles arbitrary value snapshots by stable trackBy identity', () => {
    const personArbitrary = fc.record({
      id: fc.integer({ min: 0, max: 30 }),
      name: valueArbitrary,
    });
    const snapshotArbitrary = fc.uniqueArray(personArbitrary, {
      maxLength: 15,
      selector: person => person.id,
    });

    fc.assert(fc.property(
      fc.array(snapshotArbitrary, { minLength: 1, maxLength: 30 }),
      (snapshots) => {
        const people = array({
          id: field(0, { nullable: false }),
          name: field('', { nullable: false }),
        }, [], { trackBy: person => person.id });

        snapshots.forEach((snapshot) => {
          const previousById = new Map(people.items().map(item => [item.id(), item]));
          people.items()[0]?.markAsDirty();
          people.items()[0]?.markAsTouched();
          const expectedState = new Map(people.items().map(item => [item.id(), {
            dirty: item.dirty(),
            touched: item.touched(),
          }]));

          people.set(snapshot);

          expect(people()).toEqual(snapshot);
          people.items().forEach((item, index) => {
            const previous = previousById.get(item.id());
            expect(item.parent()).toBe(people);
            expect(item.path()).toEqual([String(index)]);
            expect(item.id.path()).toEqual([String(index), 'id']);
            if (previous) {
              expect(item).toBe(previous);
              expect({ dirty: item.dirty(), touched: item.touched() })
                .toEqual(expectedState.get(item.id()));
            } else {
              expect(item.pristine()).toBe(true);
              expect(item.untouched()).toBe(true);
            }
          });
          previousById.forEach((item, id) => {
            if (!snapshot.some(person => person.id === id)) {
              expect(item.parent()).toBeNull();
              expect(item.path()).toEqual([]);
            }
          });
        });
      },
    ), { numRuns: 75 });
  });
});
