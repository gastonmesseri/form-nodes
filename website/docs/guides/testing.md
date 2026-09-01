---
title: Testing forms
description: Test Gem Forms nodes, validators, arrays, Angular bindings, and submission through the public API.
---

# Testing forms

Most form behavior can be tested as plain TypeScript. Use Angular's testing utilities only when the
test is specifically about a rendered control, DOM event, custom component, or native form.

The examples use Vitest, but the same structure works with Jest, Jasmine, or another test runner.

## Testing strategy

| What you are testing | Recommended environment |
| --- | --- |
| Values, state, synchronous validators, and node methods | Plain unit test |
| Async validation, cancellation, and debounce | Plain unit test with controlled promises or timers |
| Array identity and structural operations | Plain unit test |
| `[formNode]`, native events, custom controls, and CVAs | Angular `TestBed` with a DOM environment |
| Native form submit and reset | Angular `TestBed` with a DOM environment |

Assert behavior through public node calls, signals, and methods. Avoid testing `.api` and `$api`
when the same operation is available directly, and do not depend on private members or internal
package paths.

## Test a node tree without Angular

`form()`, `field()`, and `array()` do not require an Angular injection context:

```ts
import { describe, expect, it } from 'vitest';

import { field, form } from '@gem/ng-forms';

describe('profile form', () => {
  it('updates its value without marking programmatic writes dirty', () => {
    const profileForm = form({
      displayName: field(''),
      age: field<number>(null),
    });

    profileForm.patch({
      displayName: 'Ada',
      age: 37,
    });

    expect(profileForm()).toEqual({
      displayName: 'Ada',
      age: 37,
    });
    expect(profileForm.displayName()).toBe('Ada');
    expect(profileForm.pristine()).toBe(true);
  });
});
```

Prefer asserting the complete observable transition: value, relevant state, validation, and parent
aggregation. This catches regressions that a single return-value assertion can miss.

## Test synchronous validation

Assert both the failing state and recovery:

```ts
import { describe, expect, it } from 'vitest';

import { field, form, min, required } from '@gem/ng-forms';

describe('account validation', () => {
  it('reports typed errors and becomes valid after correction', () => {
    const accountForm = form({
      displayName: field('', [required]),
      age: field(16, [min(18)]),
    });

    expect(accountForm.invalid()).toBe(true);
    expect(accountForm.displayName.getError('required')).toBeDefined();
    expect(accountForm.age.getError('min')).toMatchObject({
      min: 18,
      actual: 16,
    });
    expect(accountForm.allErrors()).toHaveLength(2);

    accountForm.set({
      displayName: 'Ada',
      age: 37,
    });

    expect(accountForm.valid()).toBe(true);
    expect(accountForm.allErrors()).toEqual([]);
  });
});
```

Use `errors()` for rules owned by the exact node and `allErrors()` when testing aggregate validity.
See [Errors and validation status](./errors-and-status.md).

## Test asynchronous validation deterministically

Control the promise yourself instead of relying on network access or arbitrary delays:

```ts
import { describe, expect, it, vi } from 'vitest';

import { asyncValidator, field, form } from '@gem/ng-forms';

describe('username validation', () => {
  it('exposes pending state and the completed result', async () => {
    let finish!: (result: { kind: 'usernameTaken' } | null) => void;
    const result = new Promise<{ kind: 'usernameTaken' } | null>(resolve => {
      finish = resolve;
    });
    const accountForm = form({
      username: field('ada', [
        asyncValidator(() => result),
      ]),
    });

    expect(accountForm.username.pending()).toBe(true);
    expect(accountForm.username.validationStatus()).toBe('unknown');

    finish({ kind: 'usernameTaken' });

    await vi.waitFor(() => {
      expect(accountForm.username.pending()).toBe(false);
    });
    expect(accountForm.username.getError('usernameTaken')).toBeDefined();
    expect(accountForm.username.invalid()).toBe(true);
  });
});
```

For reactive or cancellable validators, additionally assert how many times the callback executes,
that the previous `abortSignal` becomes aborted, and that a stale result never replaces the latest
one. See [Async validation](./async-validation.md).

## Test debounce with fake timers

Control-originated values expose an immediate `controlValue()` and a delayed committed node value:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

import { field, form } from '@gem/ng-forms';

afterEach(() => vi.useRealTimers());

describe('search debounce', () => {
  it('commits after the configured delay', async () => {
    vi.useFakeTimers();
    const searchForm = form({
      query: field('', { debounce: 300 }),
    });

    searchForm.query.setControlValue('signals');

    expect(searchForm.query.controlValue()).toBe('signals');
    expect(searchForm.query()).toBe('');
    expect(searchForm.query.debouncing()).toBe(true);

    await vi.advanceTimersByTimeAsync(300);

    expect(searchForm.query()).toBe('signals');
    expect(searchForm.query.debouncing()).toBe(false);
    expect(searchForm.query.dirty()).toBe(true);
  });
});
```

Also test `flush()` or blur when application behavior depends on those commit paths. See
[Value flow and debounce](./value-flow-and-debounce.md).

## Test dynamic arrays

Assert values and node identity separately. `trackBy` should preserve the same item objects when
complete values arrive in a different order:

```ts
import { describe, expect, it } from 'vitest';

import { array, field } from '@gem/ng-forms';

describe('people array', () => {
  it('preserves item identity while reconciling by id', () => {
    const people = array({
      id: field('', { nullable: false }),
      displayName: field(''),
    }, {
      initialValue: [
        { id: 'a', displayName: 'Ada' },
        { id: 'g', displayName: 'Grace' },
      ],
      trackBy: 'id',
    });
    const ada = people[0];
    const grace = people[1];

    people.set([
      { id: 'g', displayName: 'Grace Hopper' },
      { id: 'a', displayName: 'Ada Lovelace' },
    ]);

    expect(people[0]).toBe(grace);
    expect(people[1]).toBe(ada);
    expect(people()).toEqual([
      { id: 'g', displayName: 'Grace Hopper' },
      { id: 'a', displayName: 'Ada Lovelace' },
    ]);
    expect(people[0]?.path()).toEqual(['0']);
  });
});
```

For `push()`, `insert()`, `removeAt()`, `move()`, and `swap()`, check the returned or retained node,
the resulting value, and updated paths. See [Dynamic arrays](./dynamic-arrays.md).

## Test submission without the DOM

Call `submit()` directly when testing validation policy and action state:

```ts
import { describe, expect, it, vi } from 'vitest';

import { field, form, required } from '@gem/ng-forms';

describe('profile submission', () => {
  it('blocks invalid values and submits the corrected snapshot', async () => {
    const saveProfile = vi.fn();
    const onInvalid = vi.fn();
    const profileForm = form({
      displayName: field('', [required]),
    }, {
      submission: {
        action: (_form, value) => saveProfile(value),
        onInvalid,
      },
    });

    await expect(profileForm.submit()).resolves.toBe(false);
    expect(onInvalid).toHaveBeenCalledWith(profileForm);
    expect(profileForm.displayName.touched()).toBe(true);
    expect(saveProfile).not.toHaveBeenCalled();

    profileForm.displayName.set('Ada');

    await expect(profileForm.submit()).resolves.toBe(true);
    expect(saveProfile).toHaveBeenCalledWith({ displayName: 'Ada' });
  });
});
```

When the action returns a controlled promise, assert that `submitting()` is true on the form and
its descendants until that promise settles. See [Form submission](./submission.md).

## Test a native `[formNode]` binding

Use `TestBed` when the behavior starts in the DOM. Import the same standalone `FormNode` directive
as production code:

```ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { field, FormNode, form } from '@gem/ng-forms';

describe('profile input', () => {
  it('moves user input into the node and marks it dirty', () => {
    @Component({
      imports: [FormNode],
      template: `
        <input [formNode]="profileForm.displayName" />
        <p>{{ profileForm.displayName() }}</p>
      `,
    })
    class Host {
      profileForm = form({
        displayName: field(''),
      });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'Ada';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.profileForm.displayName()).toBe('Ada');
    expect(fixture.componentInstance.profileForm.displayName.dirty()).toBe(true);
    expect(fixture.nativeElement.querySelector('p').textContent).toContain('Ada');
  });
});
```

Use a DOM-capable environment such as jsdom for ordinary binding tests. Use a real browser when
browser constraint validation, focus ordering, selection behavior, hydration, or platform-specific
events are part of the contract.

## Test native submit and reset

Dispatch cancelable events and verify both the browser-facing event and the node-facing result:

```ts
const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;
const submitEvent = new Event('submit', {
  bubbles: true,
  cancelable: true,
});

formElement.dispatchEvent(submitEvent);
await Promise.resolve();

expect(submitEvent.defaultPrevented).toBe(true);
expect(formElement.noValidate).toBe(true);
expect(saveProfile).toHaveBeenCalled();
```

The component needs only `imports: [FormNode]`; the same directive handles the native form and its
controls. For reset, verify that the event is prevented, committed values remain unless an explicit
value is supplied, rendered controls resynchronize, and interaction state clears.

## Test custom controls

Test the component's own Angular contract independently, then add one integration test with
`[formNode]`:

- A `model()` control should receive programmatic node values and emit user values back.
- A `ControlValueAccessor` should receive `writeValue()` and disabled state, and report change and
  touch through its registered callbacks.
- Optional state inputs such as `errors`, `required`, `touched`, and `invalid` should update when
  the corresponding node signals change.
- Optional `focus()` and `reset()` hooks should run from the public node operations.

See [Custom controls](./custom-controls.md) for every supported integration shape.

## What not to test

Avoid assertions tied to implementation details:

- Private properties, underscored runtime members, or deep package imports.
- Exact scheduling internals when public `pending()`, cancellation, and final results express the
  contract.
- Angular's own `model()`, CVA, or DOM behavior independently of the binding.
- The complete library behavior in every application test; cover only the configuration your
  application relies on.

For examples that are compiled and executed by this repository's documentation checks, see
[Executable and type-checked examples](../examples/executable-examples.mdx).
