import '@angular/compiler';
import assert from 'node:assert/strict';
import { Injector } from '@angular/core';
import { setImmediate } from 'node:timers/promises';

import { form } from '../form';
import { field } from '../field';

const owner = Injector.create({ providers: [] });
const stops: Array<() => void> = [];

function createUnreachableCase(withOwner: boolean) {
  const parent = form({ name: field('Ada') }, withOwner ? { injector: owner } : {});
  stops.push(parent.name.onValueChange(() => parent()));
  stops.push(parent.onValueChange(() => parent.name()));
  return [new WeakRef(parent), new WeakRef(parent.name)];
}

const references = [...createUnreachableCase(false), ...createUnreachableCase(true)];
for (let attempt = 0; attempt < 50; attempt++) {
  await setImmediate();
  globalThis.gc!();
  if (references.every(reference => reference.deref() === undefined)) break;
}
assert.ok(references.every(reference => reference.deref() === undefined), 'Subscriptions retained an unreachable form tree.');
stops.forEach(stop => stop());
owner.destroy();

const live = field('Ada');
const values: unknown[] = [];
const stop = live.onValueChange(value => values.push(value));
await setImmediate();
globalThis.gc!();
live.set('Grace');
assert.deepEqual(values, ['Grace']);
stop();
live.set('Lin');
assert.deepEqual(values, ['Grace']);
console.log('Value subscription ownership passed.');
