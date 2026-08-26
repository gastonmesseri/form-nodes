import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import type { FormCheckboxControl, FormValueControl } from '@angular/forms/signals';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { CSP_NONCE, Component, EventEmitter, Input, Output, ViewEncapsulation, forwardRef, input, model, output, signal, type OnDestroy } from '@angular/core';

import { array } from '../../primitives/array';
import { field } from '../../primitives/field';
import { form } from '../../primitives/form';
import { FormNode } from './form-node.directive';
import { required } from '../../validation/validators/required';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../../../testing/register-signal-input-for-jit';

registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');

declare const __FORM_NODE_SIGNAL_CONTROL_FIXTURE__: string;

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

const dispatch = (element: HTMLElement, type: string) => {
  element.dispatchEvent(new Event(type, { bubbles: true }));
};

describe('FormNode in Chromium', () => {
  it('exposes binding-scoped errors through the exported template reference', () => {
    @Component({
      standalone: true,
      imports: [FormNode],
      template: `
        <input #binding="formNode" type="text" [formNode]="age">
        <output data-errors>{{ binding.errors().length }}</output>
      `,
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
    expect(binding.errors().map((error) => error.kind)).toEqual(['parse']);
    expect(binding.errors()[0]!.formNode).toBe(binding);
  });

  it('renders and structurally updates array nodes directly through Angular @for', () => {
    @Component({
      standalone: true,
      selector: 'browser-array-for-host',
      imports: [FormNode],
      template: `
        @for (address of addresses; track address) {
          <input [attr.data-id]="address.id()" [formNode]="address.city">
        }
      `,
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
      standalone: true,
      selector: 'browser-text-form-node-host',
      imports: [FormNode],
      template: `<input [formNode]="name">`,
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

  it('reflects validation, readonly, and disabled state onto a native control', () => {
    @Component({
      standalone: true,
      selector: 'browser-state-form-node-host',
      imports: [FormNode],
      template: `<input [formNode]="name">`,
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
      standalone: true,
      selector: 'browser-native-form-node-host',
      imports: [FormNode],
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
    dispatch(country, 'change');
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

  it('resynchronizes a reused radio when its authored value changes', async () => {
    type RadioOption = { readonly id: string; readonly value: string };

    @Component({
      standalone: true,
      imports: [FormNode],
      template: `
        @for (option of options(); track option.id) {
          <input type="radio" [formNode]="selected" [value]="option.value">
        }
      `,
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
    const checkedStates = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input')).map((inputElement) => inputElement.checked);
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
      standalone: true,
      selector: 'browser-debounce-form-node-host',
      imports: [FormNode],
      template: `<input [formNode]="name">`,
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

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(fixture.componentInstance.name()).toBe('Mark');
    expect(fixture.componentInstance.name.debouncing()).toBe(false);
    fixture.destroy();
  });

  it('commits control values on blur in a real browser', () => {
    @Component({
      standalone: true,
      selector: 'browser-blur-debounce-form-node-host',
      imports: [FormNode],
      template: `<input [formNode]="name">`,
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
      standalone: true,
      selector: 'browser-parse-form-node-host',
      imports: [FormNode],
      template: `<input type="text" [formNode]="age">`,
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
      standalone: true,
      selector: 'browser-validity-form-node-host',
      imports: [FormNode],
      providers: [{ provide: CSP_NONCE, useValue: 'test-nonce' }],
      template: `
        <input data-date type="date" [formNode]="date">
        <input data-datetime type="datetime-local" [formNode]="datetime">
        <input data-month type="month" [formNode]="month">
        <input data-time type="time" [formNode]="time">
        <input data-week type="week" [formNode]="week">
      `,
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
    const validityStyle = Array.from(document.head.querySelectorAll('style')).find((style) =>
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
      standalone: true,
      selector: 'browser-shadow-validity-form-node-host',
      imports: [FormNode],
      encapsulation: ViewEncapsulation.ShadowDom,
      template: `<input type="date" [formNode]="date">`,
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
    expect(Array.from(shadowRoot.querySelectorAll('style')).some((style) =>
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
    expect(Array.from(shadowRoot.querySelectorAll('style')).some((style) =>
      style.textContent?.includes('@keyframes form-node-valid'),
    )).toBe(false);
  });

  it('integrates with a custom ControlValueAccessor through real DOM events', () => {
    @Component({
      standalone: true,
      selector: 'browser-cva',
      template: `<button type="button" [disabled]="disabled" (click)="select()" (blur)="touch()">{{ value }}</button>`,
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
      standalone: true,
      selector: 'browser-cva-form-node-host',
      imports: [BrowserCva, FormNode],
      template: `<browser-cva [formNode]="name" />`,
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
      standalone: true,
      selector: 'browser-signal-value-control',
      template: `<button type="button" [disabled]="disabled()" (click)="value.set('Mark')" (blur)="touch.emit()">{{ value() }}</button>`,
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
      standalone: true,
      selector: 'browser-signal-checkbox-control',
      template: `<button type="button" (click)="checked.update(value => !value)">{{ checked() }}</button>`,
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
      standalone: true,
      selector: 'browser-signal-control-host',
      imports: [BrowserSignalValueControl, BrowserSignalCheckboxControl, FormNode],
      template: `
        <browser-signal-value-control #valueBinding="formNode" [formNode]="name" />
        <browser-signal-checkbox-control [formNode]="active" />
      `,
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
      standalone: true,
      selector: 'browser-paired-value-control',
      template: `<button type="button" (click)="valueChange.emit('Mark')">{{ value() }}</button>`,
    })
    class PairedValueControl {
      value = input('');
      valueChange = output<string>();
    }

    @Component({
      standalone: true,
      selector: 'browser-paired-checkbox-control',
      template: `<button type="button" (click)="checkedChange.emit(!checked())">{{ checked() }}</button>`,
    })
    class PairedCheckboxControl {
      checked = input(false);
      checkedChange = output<boolean>();
    }

    registerSignalModelForJit(PairedValueControl, 'value');
    registerSignalModelForJit(PairedCheckboxControl, 'checked');

    @Component({
      standalone: true,
      selector: 'browser-paired-control-host',
      imports: [PairedValueControl, PairedCheckboxControl, FormNode],
      template: `
        <browser-paired-value-control [formNode]="name" />
        <browser-paired-checkbox-control [formNode]="active" />
      `,
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
      standalone: true,
      selector: 'browser-decorator-paired-control',
      template: `<button type="button" (click)="valueChange.emit('Mark')">{{ value }}</button>`,
    })
    class DecoratorPairedControl {
      @Input() value = '';
      @Output() valueChange = new EventEmitter<string>();
    }

    @Component({
      standalone: true,
      selector: 'browser-decorator-paired-control-host',
      imports: [DecoratorPairedControl, FormNode],
      template: `<browser-decorator-paired-control [formNode]="name" />`,
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
      standalone: true,
      selector: 'browser-profile-control',
      template: `<button type="button" (click)="value.set({ name: 'Mark', age: 31 })">{{ value().name }}</button>`,
    })
    class BrowserProfileControl implements FormValueControl<ProfileValue> {
      value = model<ProfileValue>({ name: null, age: null });
    }

    registerSignalModelForJit(BrowserProfileControl, 'value');

    @Component({
      standalone: true,
      selector: 'browser-profile-control-host',
      imports: [BrowserProfileControl, FormNode],
      template: `<browser-profile-control [formNode]="profile" />`,
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
    const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../../../integration-tests/form-node-signal-control.fixture');
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
    const module = await import(/* @vite-ignore */ __FORM_NODE_SIGNAL_CONTROL_FIXTURE__) as typeof import('../../../../../integration-tests/form-node-signal-control.fixture');
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
      standalone: true,
      selector: 'browser-echoing-cva',
      template: `<span>{{ value }}</span>`,
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
      standalone: true,
      selector: 'browser-echoing-cva-host',
      imports: [EchoingCva, FormNode],
      template: `<browser-echoing-cva [formNode]="name" />`,
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
