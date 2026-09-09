import '@angular/compiler';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';

import { form } from '../form';
import { array } from '../array';
import { field } from '../field';
import { group } from '../group';
import type { ControlDebounce, InternalNode, AnyNode } from '../../types/node.type';

function deferred() {
  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const pendingCompletion = deferred();
const rejectedCompletion = deferred();
const scheduledTimers = new Set<ReturnType<typeof setTimeout>>();
const originalSetTimeout = globalThis.setTimeout;
const scheduledCallbacks: Array<{ callback: (...args: any[]) => void; args: any[] }> = [];

// Retain the real pending timers, then cancel them so the isolated process can exit promptly.
globalThis.setTimeout = ((callback: (...args: any[]) => void, delay?: number, ...args: any[]) => {
  const timer = originalSetTimeout(callback, delay, ...args);
  scheduledTimers.add(timer);
  scheduledCallbacks.push({ callback, args });
  return timer;
}) as typeof setTimeout;

function createNode(kind: 'field' | 'array' | 'form' | 'group', debounce: ControlDebounce): AnyNode {
  if (kind === 'field') return field('initial', { debounce });
  if (kind === 'array') return array(field('initial'), 1, { debounce });
  if (kind === 'group') return group({ name: field('initial') }, { debounce });
  return form({ name: field('initial') }, { debounce });
}

function createUnreachableCase(kind: 'field' | 'array' | 'form' | 'group', debounce: ControlDebounce, cancel = false) {
  const target = createNode(kind, debounce);
  const parent = form({ nested: form({ target }) });
  const pendingValue = kind === 'field' ? 'pending' : kind === 'array' ? ['pending'] : { name: 'pending' };
  const initialValue = kind === 'field' ? 'initial' : kind === 'array' ? ['initial'] : { name: 'initial' };
  (target as InternalNode).$api._setControlValue(pendingValue);
  assert.deepEqual(target.$api.value.control(), pendingValue);
  assert.deepEqual(target(), debounce === 0 ? pendingValue : initialValue);
  assert.equal(target.$api.debouncing(), debounce !== 0);
  assert.equal(parent.dirty(), true);
  if (cancel) parent.reset();
  const references = [new WeakRef(target), new WeakRef(parent), new WeakRef(parent.nested)];
  if (kind === 'array') references.push(new WeakRef((target as ReturnType<typeof array>)[0]!));
  return { kind, references };
}

try {
  const cases = (['field', 'array', 'form', 'group'] as const).flatMap(kind => [
    createUnreachableCase(kind, 60_000),
    createUnreachableCase(kind, () => pendingCompletion.promise),
    createUnreachableCase(kind, () => rejectedCompletion.promise),
    createUnreachableCase(kind, 0),
    createUnreachableCase(kind, () => pendingCompletion.promise, true),
  ]);
  const references = cases.flatMap(testCase => testCase.references);
  for (let attempt = 0; attempt < 50; attempt++) {
    await setImmediate();
    globalThis.gc!();
    if (references.every(reference => reference.deref() === undefined)) break;
  }
  const retained = cases.flatMap((testCase, index) => {
    return testCase.references.some(reference => reference.deref() !== undefined) ? [`${testCase.kind} case ${index}`] : [];
  });
  assert.deepEqual(retained, [], 'Debounce work retained unreachable trees.');

  // Callbacks after collection must be harmless, including rejected custom work.
  scheduledCallbacks.forEach(({ callback, args }) => callback(...args));
  pendingCompletion.resolve();
  rejectedCompletion.reject(new Error('Collected debounce rejected'));
  await setImmediate();

  // Keep a node alive while the same weak scheduling path runs to completion.
  const completion = deferred();
  const live = array(field('initial'), 1, { debounce: () => completion.promise });
  (live as unknown as InternalNode).$api._setControlValue(['committed']);
  await setImmediate();
  globalThis.gc!();
  assert.deepEqual(live(), ['initial']);
  completion.resolve();
  await setImmediate();
  assert.deepEqual(live(), ['committed']);
  assert.equal(live.debouncing(), false);
  const numeric = form({ name: field('initial') }, { debounce: 25 });
  (numeric as unknown as InternalNode).$api._setControlValue({ name: 'committed' });
  assert.deepEqual(numeric(), { name: 'initial' });
  await setImmediate();
  globalThis.gc!();
  await new Promise<void>(resolve => originalSetTimeout(resolve, 30));
  assert.deepEqual(numeric(), { name: 'committed' });
  assert.equal(numeric.debouncing(), false);
  console.log('Debounce ownership and live-node completion passed.');
} finally {
  globalThis.setTimeout = originalSetTimeout;
  scheduledTimers.forEach(timer => clearTimeout(timer));
}
