import { untracked } from '@angular/core';

import type { AnyNode } from '../../types/node.type';

type ValueChangeCallback = (value: any, node: any) => void;

const callbacks = new WeakMap<AnyNode, ValueChangeCallback>();
const previousValues = new WeakMap<AnyNode, unknown>();
const unavailableValue = Symbol('Unavailable public value');
const pending = new Map<AnyNode, unknown>();
let depth = 0;
let suppressed = 0;
let notifying = false;

/** Initialization is not a change event, including initial values assigned to array clones. */
export const withoutValueChanges = <T>(operation: () => T): T => {
  suppressed++;
  try {
    return operation();
  } finally {
    suppressed--;
  }
};

const ancestors = (node: AnyNode): AnyNode[] => {
  const result: AnyNode[] = [];
  for (let current: AnyNode | null = node; current; current = current.$api.parent()) result.push(current);
  return result;
};

const flush = (errors: unknown[]) => {
  if (depth || notifying) return;
  notifying = true;
  const deliveries = new Map<AnyNode, number>();
  try {
    while (pending.size) {
      // Notify descendants first so ancestors observe changes made by descendant callbacks too.
      const node = [...pending.keys()].reduce((deepest, candidate) => {
        return ancestors(candidate).length > ancestors(deepest).length ? candidate : deepest;
      });
      const previous = pending.get(node);
      pending.delete(node);
      try {
        const value = node();
        previousValues.set(node, value);
        if (Object.is(value, previous)) continue;
        const count = (deliveries.get(node) ?? 0) + 1;
        deliveries.set(node, count);
        if (count > 100) {
          pending.clear();
          throw new Error('onValueChange callbacks did not settle after 100 notifications for one node.');
        }
        callbacks.get(node)!(value, node);
      } catch (error) {
        errors.push(error);
      }
    }
  } finally {
    pending.clear();
    notifying = false;
  }
};

const runValueChange = <T>(node: AnyNode, operation: () => T): T => {
  if (suppressed) return operation();
  depth++;
  const errors: unknown[] = [];
  let result!: T;
  try {
    untracked(() => {
      for (const ancestor of ancestors(node)) {
        if (!callbacks.has(ancestor) || pending.has(ancestor)) continue;
        try {
          const previous = ancestor();
          previousValues.set(ancestor, previous);
          pending.set(ancestor, previous);
        } catch {
          // A cached comparator failure must not prevent a subsequent write from recovering.
          pending.set(ancestor, previousValues.has(ancestor) ? previousValues.get(ancestor) : unavailableValue);
        }
      }
    });
    result = operation();
  } catch (error) {
    errors.push(error);
  } finally {
    depth--;
    untracked(() => flush(errors));
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors, 'Node value operation or onValueChange callbacks failed.');
  return result;
};

/**
 * Batches the node's existing mutation methods without effects, injectors, or live watchers.
 * Registrations are weak; pending nodes are retained only for the duration of an operation.
 * Wrap all nodes, including those without callbacks, so descendant writes notify their ancestors.
 */
export const installValueChangeNotifications = <T extends object>(
  node: AnyNode,
  callback: ValueChangeCallback | undefined,
  owner: T,
  methods: readonly (keyof T)[],
) => {
  if (callback) callbacks.set(node, callback);
  for (const method of methods) {
    const operation = Reflect.get(owner, method) as (...args: unknown[]) => unknown;
    Reflect.set(owner, method, (...args: unknown[]) => {
      return runValueChange(node, () => operation.apply(owner, args));
    });
  }
};
