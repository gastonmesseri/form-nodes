import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { FormField, type FormCheckboxControl, type FormValueControl } from '@angular/forms/signals';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { CSP_NONCE, Component, EventEmitter, Input, Output, ViewEncapsulation, forwardRef, input, model, output, signal, type OnDestroy } from '@angular/core';

import { array } from '../../primitives/array';
import { field } from '../../primitives/field';
import { form } from '../../primitives/form';
import { group } from '../../primitives/group';
import { FormNode } from './form-node.directive';
import { max } from '../../validation/validators/max';
import { min } from '../../validation/validators/min';
import { maxLength } from '../../validation/validators/max-length';
import { minLength } from '../../validation/validators/min-length';
import { provideFormNodeConfig } from './form-node-config';
import { required } from '../../validation/validators/required';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');

declare const __FORM_NODE_SIGNAL_CONTROL_FIXTURE__: string;

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

const dispatch = (element: HTMLElement, type: string) => {
  element.dispatchEvent(new Event(type, { bubbles: true }));
};

describe('FormNode in Chromium', () => {
  it('binds a library field through the Angular formField adapter', () => {
    @Component({
      template: `<input [formField]="profile.name.$field">`,
      imports: [FormField],
    })
    class Host {
      profile = form({ name: field('David') });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('David');
    input.value = 'Ana';
    dispatch(input, 'input');
    TestBed.flushEffects();
    expect(fixture.componentInstance.profile.name()).toBe('Ana');

    fixture.componentInstance.profile.name.set('Mark');
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(input.value).toBe('Mark');

    fixture.componentInstance.profile.name.focus({ preventScroll: true });
    expect(document.activeElement).toBe(input);
  });

  it('preserves a formField control edit during a simultaneous node write', () => {
    @Component({
      template: `<input [formField]="name.$field">`,
      imports: [FormField],
    })
    class Host {
      name = field('David');
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const name = fixture.componentInstance.name;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'Control edit';
    dispatch(input, 'input');
    name.set('Programmatic write');
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(name()).toBe('Control edit');
    expect(input.value).toBe('Control edit');
  });

  it('synchronizes formField interaction events and node-owned availability', () => {
    @Component({
      template: `<input [formField]="name.$field">`,
      imports: [FormField],
    })
    class Host {
      name = field('David', { debounce: 'blur' });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'Ana';
    dispatch(input, 'input');
    TestBed.flushEffects();

    expect(fixture.componentInstance.name()).toBe('David');
    expect(fixture.componentInstance.name.controlValue()).toBe('Ana');
    expect(fixture.componentInstance.name.debouncing()).toBe(true);

    dispatch(input, 'blur');
    TestBed.flushEffects();

    expect(fixture.componentInstance.name()).toBe('Ana');
    expect(fixture.componentInstance.name.debouncing()).toBe(false);
    expect(fixture.componentInstance.name.dirty()).toBe(true);
    expect(fixture.componentInstance.name.touched()).toBe(true);

    fixture.componentInstance.name.disable('Unavailable');
    fixture.detectChanges();
    expect(input.disabled).toBe(true);

    fixture.componentInstance.name.enable();
    fixture.detectChanges();
    expect(input.disabled).toBe(false);
  });

  it('propagates formField native parsing errors into Gem validation', () => {
    @Component({
      template: `<input [formField]="profile.age.$field">`,
      imports: [FormField],
    })
    class Host {
      profile = form({
        age: field(5),
      });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const profile = fixture.componentInstance.profile;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'invalid';
    dispatch(input, 'input');
    TestBed.flushEffects();

    expect(profile.age()).toBe(5);
    expect(profile.age.getError('parse')?.kind).toBe('parse');
    expect(profile.age.invalid()).toBe(true);
    expect(profile.invalid()).toBe(true);
    expect(profile.allErrors()).toHaveLength(1);

    input.value = '12';
    dispatch(input, 'input');
    TestBed.flushEffects();

    expect(profile.age()).toBe(12);
    expect(profile.age.getError('parse')).toBeUndefined();
    expect(profile.valid()).toBe(true);

    input.value = 'pending invalid value';
    dispatch(input, 'input');
    TestBed.flushEffects();
    profile.age.reset();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(profile.age.getError('parse')).toBeUndefined();
    expect(input.value).toBe('12');
  });

  it('reflects reactive Gem constraints through formField native properties', () => {
    @Component({
      template: `
        <input id="amount" type="number" [formField]="profile.amount.$field">
        <input id="code" [formField]="profile.code.$field">
      `,
      imports: [FormField],
    })
    class Host {
      minimum = signal(2);
      maximum = signal(10);
      minimumLength = signal(2);
      profile = form({
        amount: field(5, [min(() => this.minimum()), max(() => this.maximum())]),
        code: field('abc', [minLength(() => this.minimumLength()), maxLength(8)]),
      });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const amount = fixture.nativeElement.querySelector('#amount') as HTMLInputElement;
    const code = fixture.nativeElement.querySelector('#code') as HTMLInputElement;

    expect(amount.min).toBe('2');
    expect(amount.max).toBe('10');
    expect(code.minLength).toBe(2);
    expect(code.maxLength).toBe(8);

    host.minimum.set(4);
    host.maximum.set(9);
    host.minimumLength.set(3);
    fixture.detectChanges();

    expect(amount.min).toBe('4');
    expect(amount.max).toBe('9');
    expect(code.minLength).toBe(3);
    expect(code.maxLength).toBe(8);
  });

  it('reconciles dynamic array formField controls without orphaning moved or removed items', () => {
    @Component({
      template: `
        @for (person of people; track person) {
          <input [formField]="person.name.$field">
        }
      `,
      imports: [FormField],
    })
    class Host {
      people = array({
        id: field(0),
        name: field('', [minLength(2)]),
      }, {
        trackBy: 'id',
      });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const people = fixture.componentInstance.people;

    people.push({ id: 1, name: 'Ada' });
    people.push({ id: 2, name: 'Grace' });
    TestBed.flushEffects();
    fixture.detectChanges();
    const initialInputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    const graceInput = initialInputs[1]!;

    graceInput.value = 'Grace Hopper';
    dispatch(graceInput, 'input');
    dispatch(graceInput, 'blur');
    TestBed.flushEffects();
    expect(people[1]!.name()).toBe('Grace Hopper');
    expect(people[1]!.name.touched()).toBe(true);
    expect(graceInput.minLength).toBe(2);

    people.move(1, 0);
    TestBed.flushEffects();
    fixture.detectChanges();
    const movedInputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    expect(movedInputs[0]).toBe(graceInput);
    expect(movedInputs[0]!.value).toBe('Grace Hopper');
    expect(people[0]!.name.touched()).toBe(true);

    graceInput.focus();
    people.removeAt(0);
    TestBed.flushEffects();
    fixture.detectChanges();
    const remainingInput = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(graceInput.isConnected).toBe(false);
    expect(remainingInput.value).toBe('Ada');
    expect(people.length()).toBe(1);
  });

  it('bridges a native form reset through formNode into formField controls', () => {
    @Component({
      template: `
        <form [formNode]="profile">
          <input [formField]="profile.name.$field">
        </form>
      `,
      imports: [FormNode, FormField],
    })
    class Host {
      profile = form({
        name: field('David', { debounce: 'blur' }),
      });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const profile = fixture.componentInstance.profile;
    const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'Pending';
    dispatch(input, 'input');
    dispatch(input, 'blur');
    TestBed.flushEffects();
    expect(profile.name()).toBe('Pending');
    expect(profile.name.touched()).toBe(true);
    expect(profile.name.dirty()).toBe(true);

    input.value = 'Another pending value';
    dispatch(input, 'input');
    TestBed.flushEffects();
    expect(profile.name()).toBe('Pending');
    expect(profile.name.debouncing()).toBe(true);

    formElement.reset();
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(profile.name()).toBe('Pending');
    expect(profile.name.controlValue()).toBe('Pending');
    expect(profile.name.debouncing()).toBe(false);
    expect(profile.name.touched()).toBe(false);
    expect(profile.name.dirty()).toBe(false);
    expect(input.value).toBe('Pending');
  });

  it('applies form-node classes through the Angular formField adapter', () => {
    @Component({
      template: `<input [formField]="name.$field">`,
      imports: [FormField],
      providers: [provideFormNodeConfig({
        classes: {
          'is-invalid': binding => binding.node().$api.invalid(),
          'is-touched': binding => binding.node().$api.touched(),
        },
      })],
    })
    class Host {
      name = field('', [required]);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.classList.contains('is-invalid')).toBe(true);
    expect(input.classList.contains('is-touched')).toBe(false);

    dispatch(input, 'blur');
    fixture.detectChanges();

    expect(input.classList.contains('is-touched')).toBe(true);
  });

  it('tolerates a group as a native form root and preserves submit and reset state behavior', () => {
    @Component({
      template: `
        <form [formNode]="filters">
          <input [formNode]="filters.query">
        </form>
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly filters = group({ query: field('', { debounce: 'blur' }) });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const formElement = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'angular';
    dispatch(input, 'input');
    expect(fixture.componentInstance.filters.query()).toBe('');

    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    formElement.dispatchEvent(submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.filters.query()).toBe('angular');
    expect(fixture.componentInstance.filters.touched()).toBe(true);

    const resetEvent = new Event('reset', { bubbles: true, cancelable: true });
    formElement.dispatchEvent(resetEvent);

    expect(resetEvent.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.filters.touched()).toBe(false);
  });

  it('exposes binding-scoped errors through the exported template reference', () => {
    @Component({
      template: `
        <input #binding="formNode" type="text" [formNode]="age">
        <output data-errors>{{ binding.errors().length }}</output>
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly age = field(23, { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const output = fixture.nativeElement.querySelector('[data-errors]') as HTMLOutputElement;
    const binding = fixture.debugElement.children[0]!.injector.get(FormNode);

    expect(output.textContent).toBe('0');

    input.value = 'invalid';
    dispatch(input, 'input');
    fixture.detectChanges();

    expect(output.textContent).toBe('1');
    expect(binding.errors().map(error => error.kind)).toEqual(['parse']);
    expect(binding.errors()[0]!.formNode).toBe(binding);
  });

  it('renders and structurally updates array nodes directly through Angular @for', () => {
    @Component({
      selector: 'browser-array-for-host',
      template: `
        @for (address of addresses; track address) {
          <input [attr.data-id]="address.id()" [formNode]="address.city">
        }
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      addresses = array(
        { id: field(''), city: field('') },
        [
          { id: 'a', city: 'Madrid' },
          { id: 'b', city: 'Zurich' },
        ],
      );
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const inputs = () => Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    const initial = inputs();

    expect(initial.map(input => [input.dataset['id'], input.value])).toEqual([
      ['a', 'Madrid'],
      ['b', 'Zurich'],
    ]);
    const rootName = initial[0]!.name.replace(/\.0\.city$/, '');
    expect(rootName).toMatch(/\.form\d+$/);
    expect(initial.map(input => input.name)).toEqual([
      `${rootName}.0.city`,
      `${rootName}.1.city`,
    ]);

    fixture.componentInstance.addresses.push({ id: 'c', city: 'Bern' });
    fixture.detectChanges();
    expect(inputs().map(input => input.dataset['id'])).toEqual(['a', 'b', 'c']);

    fixture.componentInstance.addresses.move(2, 0);
    fixture.detectChanges();
    const moved = inputs();
    expect(moved.map(input => input.dataset['id'])).toEqual(['c', 'a', 'b']);
    expect(moved.map(input => input.name)).toEqual([
      `${rootName}.0.city`,
      `${rootName}.1.city`,
      `${rootName}.2.city`,
    ]);
    expect(moved[1]).toBe(initial[0]);
    expect(moved[2]).toBe(initial[1]);

    moved[2]!.value = 'Geneva';
    dispatch(moved[2]!, 'input');
    expect(fixture.componentInstance.addresses[2]!.city()).toBe('Geneva');

    fixture.componentInstance.addresses.removeAt(1);
    fixture.detectChanges();
    expect(inputs().map(input => [input.dataset['id'], input.value])).toEqual([
      ['c', 'Bern'],
      ['b', 'Geneva'],
    ]);
    expect(inputs()[1]).toBe(initial[1]);
    fixture.destroy();
  });

  it('synchronizes a native text input, IME composition, and interaction state', () => {
    @Component({
      selector: 'browser-text-form-node-host',
      template: `<input [formNode]="name">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('David');
    input.value = 'Mark';
    dispatch(input, 'input');
    expect(fixture.componentInstance.name()).toBe('Mark');
    expect(fixture.componentInstance.name.dirty()).toBe(true);

    dispatch(input, 'blur');
    expect(fixture.componentInstance.name.touched()).toBe(true);

    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'composition';
    dispatch(input, 'input');
    expect(fixture.componentInstance.name()).toBe('Mark');
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'composition' }));
    expect(fixture.componentInstance.name()).toBe('composition');

    fixture.componentInstance.name.set('Lia');
    fixture.detectChanges();
    expect(input.value).toBe('Lia');

    fixture.componentInstance.name.focus({ preventScroll: true });
    expect(document.activeElement).toBe(input);
    fixture.destroy();
  });

  it('continues synchronizing when a native input changes between password and text', () => {
    @Component({
      template: `<input [type]="passwordVisible() ? 'text' : 'password'" [formNode]="password">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly password = field('', { nullable: false });
      readonly passwordVisible = signal(false);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.type).toBe('password');
    fixture.componentInstance.password.set('secret');
    fixture.detectChanges();
    expect(input.value).toBe('secret');

    input.value = 'updated while hidden';
    dispatch(input, 'input');
    expect(fixture.componentInstance.password()).toBe('updated while hidden');

    fixture.componentInstance.passwordVisible.set(true);
    fixture.detectChanges();
    expect(input.type).toBe('text');

    fixture.componentInstance.password.set('visible');
    fixture.detectChanges();
    expect(input.value).toBe('visible');

    input.value = 'updated while visible';
    dispatch(input, 'input');
    expect(fixture.componentInstance.password()).toBe('updated while visible');
  });

  it('synchronizes a native textarea in both directions', () => {
    @Component({
      template: `<textarea [formNode]="notes"></textarea>`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly notes = field('', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

    expect(textarea.value).toBe('');

    fixture.componentInstance.notes.set('model value');
    fixture.detectChanges();
    expect(textarea.value).toBe('model value');

    textarea.value = 'control value';
    dispatch(textarea, 'input');
    expect(fixture.componentInstance.notes()).toBe('control value');
    expect(fixture.componentInstance.notes.dirty()).toBe(true);
  });

  it('reflects validation, readonly, and disabled state onto a native control', () => {
    @Component({
      selector: 'browser-state-form-node-host',
      template: `<input [formNode]="name">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly name = field('', [required], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.required).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');

    fixture.componentInstance.name.markAsReadonly();
    fixture.detectChanges();
    expect(input.readOnly).toBe(true);

    fixture.componentInstance.name.disable();
    fixture.detectChanges();
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('false');
    fixture.destroy();
  });

  it('uses browser-native number, checkbox, radio, and select semantics', async () => {
    @Component({
      selector: 'browser-native-form-node-host',
      template: `
        <input data-age type="number" [formNode]="age">
        <input data-active type="checkbox" [formNode]="active">
        <input data-madrid type="radio" name="city" value="Madrid" [formNode]="city">
        <input data-zurich type="radio" name="city" value="Zurich" [formNode]="city">
        <select data-country [formNode]="country">
          <option>Switzerland</option>
          <option>Spain</option>
        </select>
        <select data-cities multiple [formNode]="cities">
          <option>Madrid</option>
          <option>Zurich</option>
        </select>
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly age = field(23, { nullable: false });
      readonly active = field(false, { nullable: false });
      readonly city = field('Zurich', { nullable: false });
      readonly country = field('Switzerland', { nullable: false });
      readonly cities = field<string[]>(['Madrid'], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const age = root.querySelector('[data-age]') as HTMLInputElement;
    const active = root.querySelector('[data-active]') as HTMLInputElement;
    const madrid = root.querySelector('[data-madrid]') as HTMLInputElement;
    const zurich = root.querySelector('[data-zurich]') as HTMLInputElement;
    const country = root.querySelector('[data-country]') as HTMLSelectElement;
    const cities = root.querySelector('[data-cities]') as HTMLSelectElement;

    expect(zurich.checked).toBe(true);
    expect(country.value).toBe('Switzerland');
    expect(Array.from(cities.selectedOptions, option => option.value)).toEqual(['Madrid']);

    age.value = '42';
    dispatch(age, 'input');
    active.click();
    madrid.click();
    country.value = 'Spain';
    dispatch(country, 'input');
    cities.options[1]!.selected = true;
    dispatch(cities, 'change');

    expect(fixture.componentInstance.age()).toBe(42);
    expect(fixture.componentInstance.active()).toBe(true);
    expect(fixture.componentInstance.city()).toBe('Madrid');
    expect(fixture.componentInstance.country()).toBe('Spain');
    expect(fixture.componentInstance.cities()).toEqual(['Madrid', 'Zurich']);

    fixture.componentInstance.country.set('France');
    fixture.detectChanges();
    expect(country.value).toBe('');
    const optionMutation = new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        resolve();
      });
      observer.observe(country, { childList: true });
    });
    country.append(new Option('France'));
    await optionMutation;
    expect(country.value).toBe('France');
    fixture.destroy();
  });

  it('synchronizes a native color input in both directions', () => {
    @Component({
      template: `<input type="color" [formNode]="color">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly color = field('#ff0000', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('#ff0000');

    fixture.componentInstance.color.set('#00ff00');
    fixture.detectChanges();
    expect(input.value).toBe('#00ff00');

    input.value = '#0000ff';
    dispatch(input, 'input');
    expect(fixture.componentInstance.color()).toBe('#0000ff');
  });

  it('uses native range clamping and reacts to validator constraints', () => {
    @Component({
      template: `<input type="range" [formNode]="amount">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly minimum = signal<number | undefined>(undefined);
      readonly maximum = signal<number | undefined>(undefined);
      readonly amount = field(80, [min(() => this.minimum()), max(() => this.maximum())], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('80');

    fixture.componentInstance.amount.set(150);
    fixture.detectChanges();
    expect(input.value).toBe('100');
    expect(fixture.componentInstance.amount()).toBe(150);

    fixture.componentInstance.minimum.set(0);
    fixture.componentInstance.maximum.set(200);
    fixture.detectChanges();
    fixture.componentInstance.amount.set(101);
    fixture.detectChanges();
    expect(input.min).toBe('0');
    expect(input.max).toBe('200');
    expect(input.value).toBe('101');

    fixture.componentInstance.amount.set(220);
    fixture.detectChanges();
    expect(input.value).toBe('200');

    input.value = '42';
    dispatch(input, 'input');
    expect(fixture.componentInstance.amount()).toBe(42);
  });

  it('synchronizes numeric datetime-local values through valueAsNumber', () => {
    const initial = new Date('2024-01-01T12:30:00Z').valueOf();

    @Component({
      template: `<input type="datetime-local" [formNode]="appointment">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly appointment = field(initial, { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.valueAsNumber).toBe(initial);

    const modelValue = new Date('2025-02-02T18:45:00Z').valueOf();
    fixture.componentInstance.appointment.set(modelValue);
    fixture.detectChanges();
    expect(input.valueAsNumber).toBe(modelValue);

    const controlValue = new Date('2026-03-03T09:15:00Z').valueOf();
    input.valueAsNumber = controlValue;
    dispatch(input, 'input');
    expect(fixture.componentInstance.appointment()).toBe(controlValue);
    fixture.destroy();
  });

  it('synchronizes Date models with native date inputs', () => {
    @Component({
      selector: 'browser-date-model-form-node-host',
      template: `<input type="date" [formNode]="birthday">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly birthday = field(new Date('2024-01-01T12:00:00.000Z'), { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('2024-01-01');

    fixture.componentInstance.birthday.set(new Date('2025-02-02T12:00:00.000Z'));
    fixture.detectChanges();
    expect(input.value).toBe('2025-02-02');

    input.value = '2026-03-03';
    dispatch(input, 'input');
    expect(fixture.componentInstance.birthday()).toEqual(new Date('2026-03-03T00:00:00.000Z'));
    fixture.destroy();
  });

  it('synchronizes numeric timestamps with native date inputs', () => {
    const initial = new Date('2024-01-01T12:00:00.000Z').valueOf();

    @Component({
      selector: 'browser-date-timestamp-form-node-host',
      template: `<input type="date" [formNode]="birthday">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly birthday = field(initial, { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('2024-01-01');

    fixture.componentInstance.birthday.set(new Date('2025-02-02T12:00:00.000Z').valueOf());
    fixture.detectChanges();
    expect(input.value).toBe('2025-02-02');

    input.value = '2026-03-03';
    dispatch(input, 'input');
    expect(fixture.componentInstance.birthday()).toBe(new Date('2026-03-03T00:00:00.000Z').valueOf());
    fixture.destroy();
  });

  it('restores explicit and implicit select values when a hidden field is rendered', async () => {
    @Component({
      selector: 'browser-hidden-select-form-node-host',
      template: `
        @if (!country.hidden()) {
          <select data-explicit [formNode]="country">
            @for (option of options; track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
          <select data-implicit [formNode]="country">
            @for (option of options; track option) {
              <option>{{ option }}</option>
            }
          </select>
        }
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly visible = signal(false);
      readonly country = field('Spain', { hidden: () => !this.visible(), nullable: false });
      readonly options = ['Switzerland', 'Spain'];
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('select')).toBeNull();

    fixture.componentInstance.visible.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect((root.querySelector('[data-explicit]') as HTMLSelectElement).value).toBe('Spain');
    expect((root.querySelector('[data-implicit]') as HTMLSelectElement).value).toBe('Spain');
  });

  it('resynchronizes a reused radio when its authored value changes', async () => {
    type RadioOption = { readonly id: string; readonly value: string };

    @Component({
      template: `
        @for (option of options(); track option.id) {
          <input type="radio" [formNode]="selected" [value]="option.value">
        }
      `,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      selected = field('selected', { nullable: false });
      options = signal<readonly RadioOption[]>([
        { id: 'shared', value: 'other' },
        { id: 'old', value: 'selected' },
      ]);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const checkedStates = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input')).map(inputElement => inputElement.checked);
    expect(checkedStates()).toEqual([false, true]);

    fixture.componentInstance.options.set([
      { id: 'new', value: 'other' },
      { id: 'shared', value: 'selected' },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(checkedStates()).toEqual([false, true]);
  });

  it('commits control values after a real browser debounce timer', async () => {
    @Component({
      selector: 'browser-debounce-form-node-host',
      template: `<input [formNode]="name">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly name = field('David', { debounce: 20, nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    input.value = 'Mark';
    dispatch(input, 'input');
    expect(fixture.componentInstance.name.controlValue()).toBe('Mark');
    expect(fixture.componentInstance.name()).toBe('David');
    expect(fixture.componentInstance.name.debouncing()).toBe(true);

    await new Promise(resolve => setTimeout(resolve, 30));
    expect(fixture.componentInstance.name()).toBe('Mark');
    expect(fixture.componentInstance.name.debouncing()).toBe(false);
    fixture.destroy();
  });

  it('commits control values on blur in a real browser', () => {
    @Component({
      selector: 'browser-blur-debounce-form-node-host',
      template: `<input [formNode]="name">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly name = field('David', { debounce: 'blur', nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const inputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    inputElement.focus();
    inputElement.value = 'Mark';
    dispatch(inputElement, 'input');
    expect(fixture.componentInstance.name()).toBe('David');
    expect(fixture.componentInstance.name.debouncing()).toBe(true);

    inputElement.blur();
    expect(fixture.componentInstance.name()).toBe('Mark');
    expect(fixture.componentInstance.name.debouncing()).toBe(false);
    expect(fixture.componentInstance.name.touched()).toBe(true);
    fixture.destroy();
  });

  it('retains invalid numeric text until a valid value or reset resolves the parse error', () => {
    @Component({
      selector: 'browser-parse-form-node-host',
      template: `<input type="text" [formNode]="age">`,
      standalone: true,
      imports: [FormNode],
    })
    class Host {
      readonly age = field(23, { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const { age } = fixture.componentInstance;

    input.value = 'invalid';
    dispatch(input, 'input');
    fixture.detectChanges();

    expect(input.value).toBe('invalid');
    expect(age()).toBe(23);
    expect(age.getError('parse')?.kind).toBe('parse');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    age.reset();
    fixture.detectChanges();
    expect(input.value).toBe('23');
    expect(age.valid()).toBe(true);

    input.value = '42';
    dispatch(input, 'input');
    fixture.detectChanges();
    expect(age()).toBe(42);
    expect(age.getError('parse')).toBeUndefined();
    fixture.destroy();
  });

  it('tracks browser bad-input transitions for every date-like input and cleans up its shared style', () => {
    @Component({
      selector: 'browser-validity-form-node-host',
      template: `
        <input data-date type="date" [formNode]="date">
        <input data-datetime type="datetime-local" [formNode]="datetime">
        <input data-month type="month" [formNode]="month">
        <input data-time type="time" [formNode]="time">
        <input data-week type="week" [formNode]="week">
      `,
      standalone: true,
      imports: [FormNode],
      providers: [{ provide: CSP_NONCE, useValue: 'test-nonce' }],
    })
    class Host {
      readonly date = field('2026-08-29', { nullable: false });
      readonly datetime = field('2026-08-29T12:30', { nullable: false });
      readonly month = field('2026-08', { nullable: false });
      readonly time = field('12:30', { nullable: false });
      readonly week = field('2026-W35', { nullable: false });
    }

    const stylesBefore = document.head.querySelectorAll('style').length;
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const validityStyle = Array.from(document.head.querySelectorAll('style')).find(style =>
      style.textContent?.includes('@keyframes form-node-valid'),
    );
    expect(document.head.querySelectorAll('style')).toHaveLength(stylesBefore + 1);
    expect(validityStyle?.nonce).toBe('test-nonce');

    const cases = [
      ['date', fixture.componentInstance.date],
      ['datetime', fixture.componentInstance.datetime],
      ['month', fixture.componentInstance.month],
      ['time', fixture.componentInstance.time],
      ['week', fixture.componentInstance.week],
    ] as const;
    for (const [selector, node] of cases) {
      const input = fixture.nativeElement.querySelector(`[data-${selector}]`) as HTMLInputElement;
      const initialValue = node();
      let badInput = true;
      Object.defineProperty(input, 'validity', {
        configurable: true,
        get: () => ({ badInput }),
      });
      input.value = '';
      dispatch(input, 'input');
      fixture.detectChanges();
      expect(node()).toBe(initialValue);
      expect(node.getError('parse')?.kind).toBe('parse');

      badInput = false;
      input.dispatchEvent(new AnimationEvent('animationstart', { animationName: 'form-node-valid' }));
      fixture.detectChanges();
      expect(node()).toBe('');
      expect(node.getError('parse')).toBeUndefined();
    }

    fixture.destroy();
    expect(document.head.querySelectorAll('style')).toHaveLength(stylesBefore);
  });

  it('synchronizes a native control and cleans up validity monitoring inside Shadow DOM', () => {
    @Component({
      selector: 'browser-shadow-validity-form-node-host',
      template: `<input type="date" [formNode]="date">`,
      standalone: true,
      encapsulation: ViewEncapsulation.ShadowDom,
      imports: [FormNode],
    })
    class Host {
      readonly date = field('2026-08-29', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const shadowRoot = (fixture.nativeElement as HTMLElement).shadowRoot!;
    const inputElement = shadowRoot.querySelector('input')!;
    const { date } = fixture.componentInstance;

    expect(inputElement.value).toBe('2026-08-29');
    expect(Array.from(shadowRoot.querySelectorAll('style')).some(style =>
      style.textContent?.includes('@keyframes form-node-valid'),
    )).toBe(true);

    date.set('2026-09-01');
    fixture.detectChanges();
    expect(inputElement.value).toBe('2026-09-01');

    inputElement.value = '2026-09-02';
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(date()).toBe('2026-09-02');

    date.disable();
    fixture.detectChanges();
    expect(inputElement.disabled).toBe(true);

    fixture.destroy();
    expect(Array.from(shadowRoot.querySelectorAll('style')).some(style =>
      style.textContent?.includes('@keyframes form-node-valid'),
    )).toBe(false);
  });

  it('integrates with a custom ControlValueAccessor through real DOM events', () => {
    @Component({
      selector: 'browser-cva',
      template: `<button type="button" [disabled]="disabled" (click)="select()" (blur)="touch()">{{ value }}</button>`,
      standalone: true,
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => BrowserCva), multi: true }],
    })
    class BrowserCva implements ControlValueAccessor, OnDestroy {
      value = '';
      disabled = false;
      change = (_value: string) => {};
      touch = () => {};
      destroyed = false;
      writeValue(value: string) { this.value = value; }
      registerOnChange(callback: (value: string) => void) { this.change = callback; }
      registerOnTouched(callback: () => void) { this.touch = callback; }
      setDisabledState(disabled: boolean) { this.disabled = disabled; }
      select() { this.change('Mark'); }
      ngOnDestroy() { this.destroyed = true; }
    }

    @Component({
      selector: 'browser-cva-form-node-host',
      template: `<browser-cva [formNode]="name" />`,
      standalone: true,
      imports: [BrowserCva, FormNode],
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as BrowserCva;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.textContent).toContain('David');
    button.click();
    expect(fixture.componentInstance.name()).toBe('Mark');
    dispatch(button, 'blur');
    expect(fixture.componentInstance.name.touched()).toBe(true);

    fixture.componentInstance.name.disable();
    fixture.detectChanges();
    expect(button.disabled).toBe(true);

    fixture.destroy();
    expect(control.destroyed).toBe(true);
  });

  it('automatically integrates with Angular FormValueControl and FormCheckboxControl components', () => {
    @Component({
      selector: 'browser-signal-value-control',
      template: `<button type="button" [disabled]="disabled()" (click)="value.set('Mark')" (blur)="touch.emit()">{{ value() }}</button>`,
      standalone: true,
    })
    class BrowserSignalValueControl implements FormValueControl<string> {
      value = model('');
      touch = output<void>();
      disabled = input(false);
      required = input(false);
      invalid = input(false);
      touched = input(false);
      dirty = input(false);
      focusOptions: FocusOptions | undefined;
      resetCalls = 0;
      focus(options?: FocusOptions) { this.focusOptions = options; }
      reset() { this.resetCalls += 1; }
    }

    @Component({
      selector: 'browser-signal-checkbox-control',
      template: `<button type="button" (click)="checked.update(value => !value)">{{ checked() }}</button>`,
      standalone: true,
    })
    class BrowserSignalCheckboxControl implements FormCheckboxControl {
      checked = model(false);
    }

    registerSignalModelForJit(BrowserSignalValueControl, 'value');
    registerSignalInputForJit(BrowserSignalValueControl, 'disabled', 'disabled');
    registerSignalInputForJit(BrowserSignalValueControl, 'required', 'required');
    registerSignalInputForJit(BrowserSignalValueControl, 'invalid', 'invalid');
    registerSignalInputForJit(BrowserSignalValueControl, 'touched', 'touched');
    registerSignalInputForJit(BrowserSignalValueControl, 'dirty', 'dirty');
    registerSignalModelForJit(BrowserSignalCheckboxControl, 'checked');

    @Component({
      selector: 'browser-signal-control-host',
      template: `
        <browser-signal-value-control #valueBinding="formNode" [formNode]="name" />
        <browser-signal-checkbox-control [formNode]="active" />
      `,
      standalone: true,
      imports: [BrowserSignalValueControl, BrowserSignalCheckboxControl, FormNode],
    })
    class Host {
      name = field('David', [required], { nullable: false });
      active = field(false, { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const valueDebugElement = fixture.debugElement.children[0]!;
    const checkboxDebugElement = fixture.debugElement.children[1]!;
    const valueControl = valueDebugElement.componentInstance as BrowserSignalValueControl;
    const checkboxControl = checkboxDebugElement.componentInstance as BrowserSignalCheckboxControl;
    const valueHost = valueDebugElement.nativeElement as HTMLElement;
    const valueButton = valueDebugElement.nativeElement.querySelector('button') as HTMLButtonElement;
    const checkboxButton = checkboxDebugElement.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(valueControl.value()).toBe('David');
    expect(valueControl.required()).toBe(true);
    expect(valueControl.invalid()).toBe(false);
    expect(checkboxControl.checked()).toBe(false);
    expect('disabled' in valueHost).toBe(false);
    expect('required' in valueHost).toBe(false);

    valueButton.click();
    checkboxButton.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.name()).toBe('Mark');
    expect(fixture.componentInstance.name.dirty()).toBe(true);
    expect(fixture.componentInstance.active()).toBe(true);

    dispatch(valueButton, 'blur');
    fixture.detectChanges();
    expect(fixture.componentInstance.name.touched()).toBe(true);
    expect(valueControl.touched()).toBe(true);
    expect(valueControl.dirty()).toBe(true);

    fixture.componentInstance.name.disable();
    fixture.detectChanges();
    expect(valueControl.disabled()).toBe(true);
    expect(valueButton.disabled).toBe(true);
    expect('disabled' in valueHost).toBe(false);

    valueDebugElement.injector.get(FormNode).focus({ preventScroll: true });
    expect(valueControl.focusOptions).toEqual({ preventScroll: true });

    fixture.componentInstance.name.reset();
    expect(valueControl.resetCalls).toBe(1);
    fixture.destroy();
  });

  it('integrates with separate signal input-output control pairs', () => {
    @Component({
      selector: 'browser-paired-value-control',
      template: `<button type="button" (click)="valueChange.emit('Mark')">{{ value() }}</button>`,
      standalone: true,
    })
    class PairedValueControl {
      value = input('');
      valueChange = output<string>();
    }

    @Component({
      selector: 'browser-paired-checkbox-control',
      template: `<button type="button" (click)="checkedChange.emit(!checked())">{{ checked() }}</button>`,
      standalone: true,
    })
    class PairedCheckboxControl {
      checked = input(false);
      checkedChange = output<boolean>();
    }

    registerSignalModelForJit(PairedValueControl, 'value');
    registerSignalModelForJit(PairedCheckboxControl, 'checked');

    @Component({
      selector: 'browser-paired-control-host',
      template: `
        <browser-paired-value-control [formNode]="name" />
        <browser-paired-checkbox-control [formNode]="active" />
      `,
      standalone: true,
      imports: [PairedValueControl, PairedCheckboxControl, FormNode],
    })
    class Host {
      name = field('David', { nullable: false });
      active = field(false, { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    expect(buttons[0]!.textContent).toContain('David');
    expect(buttons[1]!.textContent).toContain('false');

    buttons[0]!.click();
    buttons[1]!.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.name()).toBe('Mark');
    expect(fixture.componentInstance.active()).toBe(true);

    fixture.componentInstance.name.set('Ada');
    fixture.componentInstance.active.set(false);
    fixture.detectChanges();
    expect(buttons[0]!.textContent).toContain('Ada');
    expect(buttons[1]!.textContent).toContain('false');
  });

  it('integrates with separate decorator input-output control pairs', () => {
    @Component({
      selector: 'browser-decorator-paired-control',
      template: `<button type="button" (click)="valueChange.emit('Mark')">{{ value }}</button>`,
      standalone: true,
    })
    class DecoratorPairedControl {
      // eslint-disable-next-line @angular-eslint/prefer-signals -- Exercise legacy decorator input-output interoperability.
      @Input() value = '';
      @Output() valueChange = new EventEmitter<string>();
    }

    @Component({
      selector: 'browser-decorator-paired-control-host',
      template: `<browser-decorator-paired-control [formNode]="name" />`,
      standalone: true,
      imports: [DecoratorPairedControl, FormNode],
    })
    class Host {
      name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('David');

    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.name()).toBe('Mark');

    fixture.componentInstance.name.set('Ada');
    fixture.detectChanges();
    expect(button.textContent).toContain('Ada');
  });

  it('binds an aggregate form to an Angular FormValueControl in Chromium', () => {
    type ProfileValue = { name: string | null; age: number | null };

    @Component({
      selector: 'browser-profile-control',
      template: `<button type="button" (click)="value.set({ name: 'Mark', age: 31 })">{{ value().name }}</button>`,
      standalone: true,
    })
    class BrowserProfileControl implements FormValueControl<ProfileValue> {
      value = model<ProfileValue>({ name: null, age: null });
    }

    registerSignalModelForJit(BrowserProfileControl, 'value');

    @Component({
      selector: 'browser-profile-control-host',
      template: `<browser-profile-control [formNode]="profile" />`,
      standalone: true,
      imports: [BrowserProfileControl, FormNode],
    })
    class Host {
      profile = form({ name: field('David'), age: field(42) });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const control = fixture.debugElement.children[0]!.componentInstance as BrowserProfileControl;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(control.value()).toEqual({ name: 'David', age: 42 });

    button.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.profile()).toEqual({ name: 'Mark', age: 31 });
    expect(fixture.componentInstance.profile.dirty()).toBe(true);
    expect(fixture.componentInstance.profile.name.pristine()).toBe(true);
    expect(fixture.componentInstance.profile.age.pristine()).toBe(true);

    fixture.componentInstance.profile.markAsPristine();
    fixture.componentInstance.profile.set({ name: 'Ada', age: 37 });
    fixture.detectChanges();
    expect(control.value()).toEqual({ name: 'Ada', age: 37 });
    expect(fixture.componentInstance.profile.pristine()).toBe(true);
    fixture.destroy();
  });

  it('automatically integrates with production-style AOT signal controls', async () => {
    const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../../../tests/integration/form-node-signal-control.fixture');
    const fixture = TestBed.createComponent(module.AotSignalControlHost);
    fixture.detectChanges();
    const valueControl = fixture.debugElement.children[0]!.componentInstance as InstanceType<typeof module.AotSignalValueControl>;
    const checkboxControl = fixture.debugElement.children[1]!.componentInstance as InstanceType<typeof module.AotSignalCheckboxControl>;
    const pairedControl = fixture.debugElement.children[2]!.componentInstance as InstanceType<typeof module.AotPairedValueControl>;
    const directiveControl = fixture.debugElement.children[3]!.injector.get(module.AotDirectiveControl);
    const directiveCheckboxControl = fixture.debugElement.children[4]!.injector.get(module.AotDirectiveCheckbox);
    const transitiveComponent = fixture.debugElement.children[5]!.componentInstance as InstanceType<typeof module.AotTransitiveControlComponent>;
    const valueButton = fixture.nativeElement.querySelector('aot-signal-value-control button') as HTMLButtonElement;
    const checkboxButton = fixture.nativeElement.querySelector('aot-signal-checkbox-control button') as HTMLButtonElement;
    const pairedButton = fixture.nativeElement.querySelector('aot-paired-value-control button') as HTMLButtonElement;
    const directiveInput = fixture.nativeElement.querySelector('input[aotDirectiveControl]') as HTMLInputElement;
    const directiveCheckbox = fixture.nativeElement.querySelector('input[aotDirectiveCheckbox]') as HTMLInputElement;
    const transitiveButton = fixture.nativeElement.querySelector('aot-transitive-signal-control button') as HTMLButtonElement;

    expect(valueControl.value()).toBe('AOT initial');
    expect(valueControl.required()).toBe(true);
    expect(checkboxControl.checked()).toBe(false);
    expect(pairedControl.value()).toBe('AOT paired initial');
    expect(directiveControl.required()).toBe(true);
    expect(directiveInput.required).toBe(false);
    expect(directiveInput.value).toBe('AOT directive initial');
    expect(directiveCheckboxControl.required()).toBe(true);
    expect(directiveCheckbox.required).toBe(false);
    expect(directiveCheckbox.checked).toBe(false);
    expect(transitiveComponent.control.required()).toBe(true);
    expect(transitiveButton.textContent).toContain('AOT transitive initial');

    valueButton.click();
    checkboxButton.click();
    pairedButton.click();
    directiveInput.value = 'AOT directive value';
    dispatch(directiveInput, 'input');
    directiveCheckbox.click();
    transitiveButton.click();
    dispatch(valueButton, 'blur');
    fixture.detectChanges();

    expect(fixture.componentInstance.name()).toBe('AOT value');
    expect(fixture.componentInstance.name.dirty()).toBe(true);
    expect(fixture.componentInstance.name.touched()).toBe(true);
    expect(fixture.componentInstance.active()).toBe(true);
    expect(fixture.componentInstance.pairedName()).toBe('AOT paired value');
    expect(fixture.componentInstance.directiveName()).toBe('AOT directive value');
    expect(fixture.componentInstance.directiveActive()).toBe(true);
    expect(fixture.componentInstance.transitiveName()).toBe('AOT transitive value');
    expect(valueControl.dirty()).toBe(true);
    expect(valueControl.touched()).toBe(true);

    fixture.componentInstance.name.disable();
    fixture.detectChanges();
    expect(valueControl.disabled()).toBe(true);
    expect(valueButton.disabled).toBe(true);
    fixture.destroy();
  });

  it('lets an AOT wrapper accept and delegate formNode without creating an outer binding', async () => {
    const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../../../tests/integration/form-node-signal-control.fixture');
    const fixture = TestBed.createComponent(module.AotPassThroughHost);
    fixture.detectChanges();
    const inputElement = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(inputElement.value).toBe('AOT wrapper initial');

    inputElement.value = 'updated';
    dispatch(inputElement, 'input');
    expect(fixture.componentInstance.name()).toBe('updated');

    fixture.componentInstance.name.focus();
    expect(document.activeElement).toBe(inputElement);
    fixture.destroy();
  });

  it('ignores a reentrant onChange callback during a CVA model-to-view write', () => {
    @Component({
      selector: 'browser-echoing-cva',
      template: `<span>{{ value }}</span>`,
      standalone: true,
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EchoingCva), multi: true }],
    })
    class EchoingCva implements ControlValueAccessor {
      value = '';
      change = (_value: string) => {};
      writeValue(value: string) {
        this.value = value;
        this.change(value);
      }
      registerOnChange(callback: (value: string) => void) { this.change = callback; }
      registerOnTouched() {}
    }

    @Component({
      selector: 'browser-echoing-cva-host',
      template: `<browser-echoing-cva [formNode]="name" />`,
      standalone: true,
      imports: [EchoingCva, FormNode],
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(fixture.componentInstance.name()).toBe('David');
    expect(fixture.componentInstance.name.dirty()).toBe(false);
    expect(fixture.nativeElement.querySelector('span').textContent).toContain('David');
    fixture.destroy();
  });
});
