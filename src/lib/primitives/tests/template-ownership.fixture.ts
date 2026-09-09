import '@angular/compiler';
import assert from 'node:assert/strict';
import { Injector, signal } from '@angular/core';

import { form } from '../form';
import { array } from '../array';
import { field } from '../field';
import { group } from '../group';
import { required } from '../../validation/validators/required';
import { asyncValidator } from '../../validation/async-validator';

const dependency = signal(0);
const observedValues: (string | null)[] = [];
const ownedInjector = Injector.create({ providers: [] });
const validate = asyncValidator<string | null>(async ({ value }) => {
  dependency();
  observedValues.push(value());
  return null;
});

function createFieldTemplateCase() {
  const template = field('', [required], { debounce: 'blur' });
  const parent = form({ name: template });
  const items = array(template);
  template.setValidators([]);
  template.value.control.set('uncommitted');
  return {
    references: [new WeakRef(template), new WeakRef(parent)],
    verify() {
      const item = items.push();
      assert.equal(item(), '');
      assert.equal(item.required(), true);
      assert.equal(item.pristine(), true);
      assert.equal(item.untouched(), true);
      item.value.control.set('next');
      assert.equal(item(), '');
      assert.equal(item.debouncing(), true);
      item.flush();
      assert.equal(item(), 'next');
      assert.equal(item.valid(), true);
    },
  };
}

function createNestedTemplateCase() {
  const template = field('initial');
  const parent = form({ name: template });
  const items = array({ nested: { name: template } });
  return {
    references: [new WeakRef(template), new WeakRef(parent)],
    verify() {
      assert.deepEqual(items.push()(), { nested: { name: 'initial' } });
    },
  };
}

function createAggregateTemplateCase(kind: 'form' | 'group') {
  const template = kind === 'form' ? form({ name: field('initial') }) : group({ name: field('initial') });
  const parent = form({ nested: template });
  const items = array(template);
  return {
    references: [new WeakRef(template), new WeakRef(parent), new WeakRef(template.name)],
    verify() {
      assert.deepEqual(items.push()(), { name: 'initial' });
    },
  };
}

function createArrayTemplateCase() {
  const template = array(field('initial'), 1);
  const parent = form({ nested: template });
  const items = array(template);
  return {
    references: [new WeakRef(template), new WeakRef(parent), new WeakRef(template.at(0)!)],
    verify() {
      assert.deepEqual(items.push()(), ['initial']);
    },
  };
}

function createAsyncTemplateCase() {
  const template = field('initial', [validate], { injector: ownedInjector, inheritInjector: false });
  const parent = form({ name: template });
  const items = array(template, 1);
  template.set('source only');
  return {
    // This case deliberately retains the source tree to verify its independent injector lifecycle.
    references: [] as WeakRef<object>[],
    async verify() {
      assert.equal(parent.name, template);
      observedValues.length = 0;
      dependency.set(1);
      await new Promise<void>(resolve => setImmediate(resolve));
      assert.deepEqual([...observedValues].sort(), ['initial', 'source only']);
      assert.equal(items.at(0)!.valid(), true);
      ownedInjector.destroy();
      observedValues.length = 0;
      dependency.set(2);
      await new Promise<void>(resolve => setImmediate(resolve));
      assert.deepEqual(observedValues, []);
    },
  };
}

// Collection cases keep arrays alive and source nodes weak; the injector case retains its source explicitly.
const cases = [
  createFieldTemplateCase(),
  createNestedTemplateCase(),
  createAggregateTemplateCase('form'),
  createAggregateTemplateCase('group'),
  createArrayTemplateCase(),
  createAsyncTemplateCase(),
];
const references = cases.flatMap(testCase => testCase.references);
for (let attempt = 0; attempt < 50; attempt++) {
  await new Promise<void>(resolve => setImmediate(resolve));
  globalThis.gc!();
  if (references.every(reference => reference.deref() === undefined)) break;
}
cases.forEach((testCase, index) => {
  assert.ok(testCase.references.every(reference => reference.deref() === undefined), `Template case ${index} retained source nodes.`);
});
for (const testCase of cases) await testCase.verify();
console.log('Template ownership and future item creation passed.');
