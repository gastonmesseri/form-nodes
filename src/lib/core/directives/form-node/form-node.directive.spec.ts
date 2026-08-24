// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, forwardRef, inject, signal } from '@angular/core';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { DefaultValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, NgControl, NumberValueAccessor, Validators, type AbstractControl, type ControlValueAccessor, type ValidationErrors, type Validator } from '@angular/forms';

import { form } from '../../primitives/form';
import { field } from '../../primitives/field';
import type { Field } from '../../primitives/field';
import { FormNodeDirective } from './form-node.directive';
import { FormNodeNgControl } from './form-node-ng-control';
import { required } from '../../validation/validators/required';
import { registerSignalInputForJit } from '../../../../../testing/register-signal-input-for-jit';
import { isNativeFormNodeControl, parseNativeControlValue, readNativeControlValue, writeNativeControlValue } from './native-control';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

const dispatch = (element: HTMLElement, type: string) => {
  element.dispatchEvent(new Event(type, { bubbles: true }));
};

const accessorWithPrototype = (prototype: object): ControlValueAccessor & { writes: unknown[] } => {
  const accessor = Object.create(prototype) as ControlValueAccessor & { writes: unknown[] };
  accessor.writes = [];
  accessor.writeValue = (value: unknown) => { accessor.writes.push(value); };
  accessor.registerOnChange = () => {};
  accessor.registerOnTouched = () => {};
  accessor.setDisabledState = () => {};
  return accessor;
};

describe('FormNodeDirective', () => {
  it('synchronizes native text values and interaction state in both directions', () => {
    @Component({
      standalone: true,
      selector: 'text-form-node-host',
      imports: [FormNodeDirective],
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
    fixture.detectChanges();

    expect(fixture.componentInstance.name()).toBe('Mark');
    expect(fixture.componentInstance.name.dirty()).toBe(true);

    dispatch(input, 'blur');
    expect(fixture.componentInstance.name.touched()).toBe(true);

    fixture.componentInstance.name.set('Lia');
    fixture.detectChanges();
    expect(input.value).toBe('Lia');

    const binding = fixture.debugElement.children[0]!.injector.get(FormNodeDirective);
    const focus = vi.spyOn(input, 'focus');
    binding.focus({ preventScroll: true });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });

    input.value = 'pending';
    dispatch(input, 'compositionstart');
    dispatch(input, 'input');
    expect(fixture.componentInstance.name()).toBe('Lia');
    dispatch(input, 'compositionend');
    expect(fixture.componentInstance.name()).toBe('pending');

    fixture.componentInstance.name.markAsTouched();
    fixture.componentInstance.name.markAsDirty();
    binding.reset();
    expect(fixture.componentInstance.name.touched()).toBe(false);
    expect(fixture.componentInstance.name.dirty()).toBe(false);

    binding.flush();
  });

  it('binds a field nested inside a form tree', () => {
    @Component({
      standalone: true,
      selector: 'nested-form-node-host',
      imports: [FormNodeDirective],
      template: `<input [formNode]="profile.address.city">`,
    })
    class Host {
      readonly profile = form({
        name: field('David', { nullable: false }),
        address: form({
          city: field('Zurich', { nullable: false }),
        }),
      });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const { profile } = fixture.componentInstance;

    expect(input.value).toBe('Zurich');
    expect(profile.address.city.path()).toEqual(['address', 'city']);
    expect(profile.address.city.parent()).toBe(profile.address);
    expect(profile.address.city.form()).toBe(profile);

    input.value = 'Bern';
    dispatch(input, 'input');
    expect(profile()).toEqual({ name: 'David', address: { city: 'Bern' } });

    profile.patch({ address: { city: 'Geneva' } });
    fixture.detectChanges();
    expect(input.value).toBe('Geneva');
  });

  it('keeps the last valid numeric model value and contributes parse errors to its form tree', () => {
    @Component({
      standalone: true,
      selector: 'numeric-parse-form-node-host',
      imports: [FormNodeDirective],
      template: `<input type="text" [formNode]="profile.age">`,
    })
    class Host {
      readonly profile = form({ age: field(23, { nullable: false }) });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const { profile } = fixture.componentInstance;

    input.value = 'not-a-number';
    dispatch(input, 'input');
    fixture.detectChanges();

    expect(input.value).toBe('not-a-number');
    expect(profile.age()).toBe(23);
    expect(profile.age.controlValue()).toBe(23);
    expect(profile.age.dirty()).toBe(true);
    expect(profile.age.getError('parse')).toMatchObject({ kind: 'parse', targetNode: profile.age });
    expect(profile.invalid()).toBe(true);
    expect(profile.allErrors()).toContain(profile.age.getError('parse'));

    profile.age.set(30);
    fixture.detectChanges();
    expect(input.value).toBe('30');
    expect(profile.age.getError('parse')).toBeUndefined();

    input.value = '42';
    dispatch(input, 'input');
    fixture.detectChanges();

    expect(profile.age()).toBe(42);
    expect(profile.age.getError('parse')).toBeUndefined();
    expect(profile.valid()).toBe(true);
  });

  it('tracks parse errors per binding and clears stale raw input on field reset', () => {
    @Component({
      standalone: true,
      selector: 'multiple-parse-form-node-host',
      imports: [FormNodeDirective],
      template: `
        <input data-first type="text" [formNode]="age">
        <input data-second type="text" [formNode]="age">
      `,
    })
    class Host {
      readonly age = field(23, { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector('[data-first]') as HTMLInputElement;
    const second = fixture.nativeElement.querySelector('[data-second]') as HTMLInputElement;
    const { age } = fixture.componentInstance;

    first.value = 'first-invalid';
    dispatch(first, 'input');
    second.value = 'second-invalid';
    dispatch(second, 'input');
    fixture.detectChanges();

    expect(age()).toBe(23);
    expect(age.errors().filter((error) => error.kind === 'parse')).toHaveLength(2);
    expect(first.value).toBe('first-invalid');
    expect(second.value).toBe('second-invalid');

    age.reset();
    fixture.detectChanges();

    expect(age.getError('parse')).toBeUndefined();
    expect(age.pristine()).toBe(true);
    expect(first.value).toBe('23');
    expect(second.value).toBe('23');
  });

  it('moves native parse-error ownership when the bound field changes', () => {
    @Component({
      standalone: true,
      selector: 'dynamic-parse-form-node-host',
      imports: [FormNodeDirective],
      template: `<input type="text" [formNode]="selected()">`,
    })
    class Host {
      readonly first = field(23, { nullable: false });
      readonly second = field(42, { nullable: false });
      readonly selected = signal<Field<number>>(this.first);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const { first, second, selected } = fixture.componentInstance;

    input.value = 'invalid';
    dispatch(input, 'input');
    fixture.detectChanges();
    expect(first.getError('parse')?.kind).toBe('parse');

    selected.set(second);
    fixture.detectChanges();
    expect(first.getError('parse')).toBeUndefined();
    expect(second.getError('parse')).toBeUndefined();
    expect(input.value).toBe('42');

    input.value = 'still-invalid';
    dispatch(input, 'input');
    fixture.detectChanges();
    expect(second.getError('parse')?.kind).toBe('parse');

    fixture.destroy();
    expect(second.getError('parse')).toBeUndefined();
  });

  it('binds disabled, readonly, required, and aria-invalid state', () => {
    @Component({
      standalone: true,
      selector: 'state-form-node-host',
      imports: [FormNodeDirective],
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
  });

  it('buffers native input through the field control debounce', async () => {
    vi.useFakeTimers();
    try {
      @Component({
        standalone: true,
        selector: 'debounce-form-node-host',
        imports: [FormNodeDirective],
        template: `<input [formNode]="name">`,
      })
      class Host {
        readonly name = field('David', { debounce: 100, nullable: false });
      }

      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

      input.value = 'Mark';
      dispatch(input, 'input');

      expect(fixture.componentInstance.name.controlValue()).toBe('Mark');
      expect(fixture.componentInstance.name()).toBe('David');
      expect(fixture.componentInstance.name.debouncing()).toBe(true);

      await vi.advanceTimersByTimeAsync(100);
      expect(fixture.componentInstance.name()).toBe('Mark');
    } finally {
      vi.useRealTimers();
    }
  });

  it('parses number and checkbox controls using their native value types', () => {
    @Component({
      standalone: true,
      selector: 'typed-native-form-node-host',
      imports: [FormNodeDirective],
      template: `
        <input type="number" [formNode]="age">
        <input type="checkbox" [formNode]="active">
      `,
    })
    class Host {
      readonly age = field(23, { nullable: false });
      readonly active = field(false, { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [age, active] = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

    age!.value = '42';
    dispatch(age!, 'input');
    active!.checked = true;
    dispatch(active!, 'change');

    expect(fixture.componentInstance.age()).toBe(42);
    expect(fixture.componentInstance.active()).toBe(true);
  });

  it('synchronizes a native radio group through a shared field', () => {
    @Component({
      standalone: true,
      selector: 'radio-form-node-host',
      imports: [FormNodeDirective],
      template: `
        <input type="radio" name="city" value="Madrid" [formNode]="city">
        <input type="radio" name="city" value="Zurich" [formNode]="city">
      `,
    })
    class Host {
      readonly city = field('Zurich', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [madrid, zurich] = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

    expect(madrid!.checked).toBe(false);
    expect(zurich!.checked).toBe(true);

    dispatch(madrid!, 'change');
    expect(fixture.componentInstance.city()).toBe('Zurich');

    madrid!.checked = true;
    dispatch(madrid!, 'change');
    fixture.detectChanges();

    expect(fixture.componentInstance.city()).toBe('Madrid');
    expect(madrid!.checked).toBe(true);
    expect(zurich!.checked).toBe(false);
  });

  it('supports single and multiple native selects and reapplies values after option mutations', async () => {
    @Component({
      standalone: true,
      selector: 'select-form-node-host',
      imports: [FormNodeDirective],
      template: `
        <select [formNode]="city"><option>Madrid</option><option>Zurich</option></select>
        <select multiple [formNode]="cities"><option>Madrid</option><option>Zurich</option></select>
      `,
    })
    class Host {
      readonly city = field('Zurich', { nullable: false });
      readonly cities = field<string[]>(['Madrid'], { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const [city, cities] = fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;

    expect(city!.value).toBe('Zurich');
    expect(Array.from(cities!.selectedOptions, (option) => option.value)).toEqual(['Madrid']);

    cities!.options[1]!.selected = true;
    dispatch(cities!, 'change');
    expect(fixture.componentInstance.cities()).toEqual(['Madrid', 'Zurich']);

    fixture.componentInstance.city.set('Paris');
    fixture.detectChanges();
    expect(city!.value).toBe('');
    const optionMutation = new Promise<void>((resolve) =>
      new MutationObserver(() => resolve()).observe(city!, { childList: true }),
    );
    city!.append(new Option('Paris'));
    await optionMutation;
    expect(city!.value).toBe('Paris');
  });

  it('integrates with a custom ControlValueAccessor and provides NgControl', () => {
    @Component({
      standalone: true,
      selector: 'test-cva',
      template: '',
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: forwardRef(() => TestCva),
        multi: true,
      }, {
        provide: NG_VALIDATORS,
        useExisting: forwardRef(() => TestCva),
        multi: true,
      }],
    })
    class TestCva implements ControlValueAccessor, Validator {
      readonly ngControl = inject(NgControl, { self: true });
      value: unknown;
      disabled = false;
      rejectValue = false;
      change = (_value: unknown) => {};
      touch = () => {};
      validatorChange = () => {};
      writeValue(value: unknown) { this.value = value; }
      registerOnChange(callback: (value: unknown) => void) { this.change = callback; }
      registerOnTouched(callback: () => void) { this.touch = callback; }
      setDisabledState(disabled: boolean) { this.disabled = disabled; }
      validate(_control: AbstractControl): ValidationErrors | null {
        return this.rejectValue ? { customCva: { rejected: true } } : null;
      }
      registerOnValidatorChange(callback: () => void) { this.validatorChange = callback; }
    }

    @Component({
      standalone: true,
      selector: 'cva-form-node-host',
      imports: [FormNodeDirective, TestCva],
      template: `<test-cva [formNode]="active()" />`,
    })
    class Host {
      readonly name = field('David', { nullable: false });
      readonly alternative = field('Lia', { nullable: false });
      readonly active = signal(this.name);
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cva = fixture.debugElement.children[0]!.componentInstance as TestCva;

    expect(cva.value).toBe('David');
    cva.change('Mark');
    expect(fixture.componentInstance.name()).toBe('Mark');
    cva.touch();
    expect(fixture.componentInstance.name.touched()).toBe(true);

    fixture.componentInstance.name.disable();
    fixture.detectChanges();
    expect(cva.disabled).toBe(true);
    expect(cva.ngControl).toBe(fixture.debugElement.children[0]!.injector.get(NgControl));

    fixture.componentInstance.name.enable();
    cva.rejectValue = true;
    cva.validatorChange();
    fixture.detectChanges();
    expect(fixture.componentInstance.name.invalid()).toBe(true);
    expect(fixture.componentInstance.name.getError('customCva')).toMatchObject({
      kind: 'customCva',
      context: { rejected: true },
      targetNode: fixture.componentInstance.name,
    });

    cva.rejectValue = false;
    cva.validatorChange();
    fixture.detectChanges();
    expect(fixture.componentInstance.name.valid()).toBe(true);

    cva.rejectValue = true;
    cva.validatorChange();
    fixture.detectChanges();
    expect(fixture.componentInstance.name.invalid()).toBe(true);

    fixture.componentInstance.active.set(fixture.componentInstance.alternative);
    fixture.detectChanges();
    expect(fixture.debugElement.children[0]!.injector.get(FormNodeDirective).field)
      .toBe(fixture.componentInstance.alternative);
    expect(fixture.componentInstance.name.valid()).toBe(true);
    expect(fixture.componentInstance.alternative.getError('customCva')?.targetNode)
      .toBe(fixture.componentInstance.alternative);

    fixture.destroy();
    expect(fixture.componentInstance.alternative.valid()).toBe(true);
  });

  it('rejects a host that is neither a native control nor a ControlValueAccessor', () => {
    @Component({
      standalone: true,
      selector: 'invalid-form-node-host',
      imports: [FormNodeDirective],
      template: `<div [formNode]="name"></div>`,
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    expect(() => TestBed.createComponent(Host).detectChanges())
      .toThrowError('formNode: the host must be a native form control or provide ControlValueAccessor');
  });

  it('rejects multiple custom ControlValueAccessors on the same host', () => {
    const accessor = (): ControlValueAccessor => ({
      writeValue: () => {},
      registerOnChange: () => {},
      registerOnTouched: () => {},
    });

    @Component({
      standalone: true,
      selector: 'ambiguous-cva',
      template: '',
      providers: [
        { provide: NG_VALUE_ACCESSOR, useFactory: accessor, multi: true },
        { provide: NG_VALUE_ACCESSOR, useFactory: accessor, multi: true },
      ],
    })
    class AmbiguousCva {}

    @Component({
      standalone: true,
      selector: 'ambiguous-cva-host',
      imports: [AmbiguousCva, FormNodeDirective],
      template: `<ambiguous-cva [formNode]="name" />`,
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    expect(() => TestBed.createComponent(Host).detectChanges())
      .toThrowError('formNode: more than one custom ControlValueAccessor matches the host');
  });

  it('prefers a custom accessor over Angular built-in and default accessors', () => {
    const custom: ControlValueAccessor & { writes: unknown[] } = {
      writes: [],
      writeValue(value: unknown) { this.writes.push(value); },
      registerOnChange: () => {},
      registerOnTouched: () => {},
    };

    @Component({
      standalone: true,
      selector: 'accessor-priority-control',
      template: '',
      providers: [
        { provide: NG_VALUE_ACCESSOR, useFactory: () => Object.create(DefaultValueAccessor.prototype), multi: true },
        { provide: NG_VALUE_ACCESSOR, useFactory: () => Object.create(NumberValueAccessor.prototype), multi: true },
        { provide: NG_VALUE_ACCESSOR, useValue: custom, multi: true },
      ],
    })
    class PriorityControl {}

    @Component({
      standalone: true,
      selector: 'accessor-priority-host',
      imports: [FormNodeDirective, PriorityControl],
      template: `<accessor-priority-control [formNode]="name" />`,
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(custom.writes).toEqual(['David']);
  });

  it.each([
    ['default', DefaultValueAccessor.prototype],
    ['built-in', NumberValueAccessor.prototype],
  ])('uses a single %s accessor when no higher-priority accessor exists', (_kind, prototype) => {
    let accessor!: ReturnType<typeof accessorWithPrototype>;

    @Component({
      standalone: true,
      selector: 'single-angular-accessor',
      host: { 'data-accessor-kind': _kind },
      template: '',
      providers: [{
        provide: NG_VALUE_ACCESSOR,
        useFactory: () => (accessor = accessorWithPrototype(prototype)),
        multi: true,
      }],
    })
    class SingleAccessorControl {}

    @Component({
      standalone: true,
      selector: 'single-angular-accessor-host',
      host: { 'data-accessor-kind': _kind },
      imports: [FormNodeDirective, SingleAccessorControl],
      template: `<single-angular-accessor [formNode]="name" />`,
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect(accessor.writes).toEqual(['David']);
  });

  it.each([
    ['default', DefaultValueAccessor.prototype, 'formNode: more than one default ControlValueAccessor matches the host'],
    ['built-in', NumberValueAccessor.prototype, 'formNode: more than one built-in ControlValueAccessor matches the host'],
  ])('rejects multiple %s accessors', (_kind, prototype, message) => {
    @Component({
      standalone: true,
      selector: 'duplicate-angular-accessor',
      host: { 'data-accessor-kind': _kind },
      template: '',
      providers: [
        { provide: NG_VALUE_ACCESSOR, useFactory: () => accessorWithPrototype(prototype), multi: true },
        { provide: NG_VALUE_ACCESSOR, useFactory: () => accessorWithPrototype(prototype), multi: true },
      ],
    })
    class DuplicateAccessorControl {}

    @Component({
      standalone: true,
      selector: 'duplicate-angular-accessor-host',
      host: { 'data-accessor-kind': _kind },
      imports: [DuplicateAccessorControl, FormNodeDirective],
      template: `<duplicate-angular-accessor [formNode]="name" />`,
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    expect(() => TestBed.createComponent(Host).detectChanges()).toThrowError(message);
  });

  it('reports access before its required field input is initialized', () => {
    @Component({
      standalone: true,
      selector: 'missing-field-host',
      imports: [FormNodeDirective],
      template: `<input formNode>`,
    })
    class Host {}

    const fixture = TestBed.createComponent(Host);
    const binding = fixture.debugElement.children[0]!.injector.get(FormNodeDirective);
    expect(() => binding.field).toThrowError('formNode: a field node is required');
    expect(() => binding.node()).toThrowError('formNode: a field node is required');
    fixture.destroy();
  });

  it('supports a minimal CVA without disabled handling or legacy validators and ignores callbacks after destroy', () => {
    @Component({
      standalone: true,
      selector: 'minimal-cva',
      template: '',
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MinimalCva), multi: true }],
    })
    class MinimalCva implements ControlValueAccessor {
      change = (_value: unknown) => {};
      touch = () => {};
      writes: unknown[] = [];
      writeValue(value: unknown) { this.writes.push(value); }
      registerOnChange(callback: (value: unknown) => void) { this.change = callback; }
      registerOnTouched(callback: () => void) { this.touch = callback; }
    }

    @Component({
      standalone: true,
      selector: 'minimal-cva-host',
      imports: [FormNodeDirective, MinimalCva],
      template: `<minimal-cva [formNode]="name" />`,
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cva = fixture.debugElement.children[0]!.componentInstance as MinimalCva;
    fixture.destroy();
    cva.change('ignored');
    cva.touch();
    expect(fixture.componentInstance.name()).toBe('David');
    expect(fixture.componentInstance.name.touched()).toBe(false);
  });

  it('does not loop or duplicate model writes when writeValue synchronously calls onChange', () => {
    @Component({
      standalone: true,
      selector: 'echoing-cva',
      template: '',
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EchoingCva), multi: true }],
    })
    class EchoingCva implements ControlValueAccessor {
      change = (_value: unknown) => {};
      writes: unknown[] = [];
      writeValue(value: unknown) {
        this.writes.push(value);
        this.change(value);
      }
      registerOnChange(callback: (value: unknown) => void) { this.change = callback; }
      registerOnTouched() {}
    }

    @Component({
      standalone: true,
      selector: 'echoing-cva-host',
      imports: [FormNodeDirective, EchoingCva],
      template: `<echoing-cva [formNode]="name" />`,
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cva = fixture.debugElement.children[0]!.componentInstance as EchoingCva;

    expect(cva.writes).toEqual(['David']);
    expect(fixture.componentInstance.name()).toBe('David');
    expect(fixture.componentInstance.name.dirty()).toBe(false);

    fixture.componentInstance.name.set('Mark');
    fixture.detectChanges();

    expect(cva.writes).toEqual(['David', 'Mark']);
    expect(fixture.componentInstance.name()).toBe('Mark');
  });

  it('supports a signal-based CVA without creating reactive write errors', () => {
    @Component({
      standalone: true,
      selector: 'signal-cva',
      template: '',
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SignalCva), multi: true }],
    })
    class SignalCva implements ControlValueAccessor {
      readonly value = signal<unknown>(undefined);
      readonly disabled = signal(false);
      change = (_value: unknown) => {};
      writeValue(value: unknown) { this.value.set(value); }
      registerOnChange(callback: (value: unknown) => void) { this.change = callback; }
      registerOnTouched() {}
      setDisabledState(disabled: boolean) { this.disabled.set(disabled); }
    }

    @Component({
      standalone: true,
      selector: 'signal-cva-host',
      imports: [FormNodeDirective, SignalCva],
      template: `<signal-cva [formNode]="name" />`,
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    expect(() => fixture.detectChanges()).not.toThrow();
    const cva = fixture.debugElement.children[0]!.componentInstance as SignalCva;

    expect(cva.value()).toBe('David');
    fixture.componentInstance.name.disable();
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(cva.disabled()).toBe(true);
  });

  it('cleans up and reconnects a CVA when its host is destroyed and recreated', () => {
    const instances: RecreatedCva[] = [];

    @Component({
      standalone: true,
      selector: 'recreated-cva',
      template: '',
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => RecreatedCva), multi: true }],
    })
    class RecreatedCva implements ControlValueAccessor {
      change = (_value: unknown) => {};
      touch = () => {};
      writes: unknown[] = [];
      constructor() { instances.push(this); }
      writeValue(value: unknown) { this.writes.push(value); }
      registerOnChange(callback: (value: unknown) => void) { this.change = callback; }
      registerOnTouched(callback: () => void) { this.touch = callback; }
    }

    @Component({
      standalone: true,
      selector: 'recreated-cva-host',
      imports: [FormNodeDirective, RecreatedCva],
      template: `@if (visible()) { <recreated-cva [formNode]="name" /> }`,
    })
    class Host {
      readonly visible = signal(true);
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const first = instances[0]!;

    fixture.componentInstance.visible.set(false);
    fixture.detectChanges();
    first.change('ignored');
    first.touch();
    expect(fixture.componentInstance.name()).toBe('David');
    expect(fixture.componentInstance.name.touched()).toBe(false);

    fixture.componentInstance.name.set('Mark');
    fixture.componentInstance.visible.set(true);
    fixture.detectChanges();
    const second = instances[1]!;

    expect(second).not.toBe(first);
    expect(second.writes).toEqual(['Mark']);
    second.change('Lia');
    second.touch();
    expect(fixture.componentInstance.name()).toBe('Lia');
    expect(fixture.componentInstance.name.touched()).toBe(true);
  });

  it('re-evaluates object legacy validators only after their change callback is invoked', () => {
    @Component({
      standalone: true,
      selector: 'dynamic-validator-cva',
      template: '',
      providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DynamicValidatorCva), multi: true },
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => DynamicValidatorCva), multi: true },
      ],
    })
    class DynamicValidatorCva implements ControlValueAccessor, Validator {
      reject = false;
      validatorChange = () => {};
      writeValue() {}
      registerOnChange() {}
      registerOnTouched() {}
      validate(): ValidationErrors | null { return this.reject ? { dynamicLegacy: true } : null; }
      registerOnValidatorChange(callback: () => void) { this.validatorChange = callback; }
    }

    @Component({
      standalone: true,
      selector: 'dynamic-validator-host',
      imports: [FormNodeDirective, DynamicValidatorCva],
      template: `<dynamic-validator-cva [formNode]="name" />`,
    })
    class Host {
      readonly name = field('David', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cva = fixture.debugElement.children[0]!.componentInstance as DynamicValidatorCva;

    cva.reject = true;
    fixture.detectChanges();
    expect(fixture.componentInstance.name.valid()).toBe(true);

    cva.validatorChange();
    fixture.detectChanges();
    expect(fixture.componentInstance.name.getError('dynamicLegacy')?.kind).toBe('dynamicLegacy');

    cva.reject = false;
    cva.validatorChange();
    fixture.detectChanges();
    expect(fixture.componentInstance.name.valid()).toBe(true);
  });

  it('adapts function-based legacy validators', () => {
    const legacyValidator = (control: AbstractControl): ValidationErrors | null =>
      control.value === 'invalid' ? { legacyFunction: true } : null;

    @Component({
      standalone: true,
      selector: 'function-validator-cva',
      template: '',
      providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FunctionValidatorCva), multi: true },
        { provide: NG_VALIDATORS, useValue: legacyValidator, multi: true },
      ],
    })
    class FunctionValidatorCva implements ControlValueAccessor {
      change = (_value: unknown) => {};
      writeValue() {}
      registerOnChange(callback: (value: unknown) => void) { this.change = callback; }
      registerOnTouched() {}
    }

    @Component({
      standalone: true,
      selector: 'function-validator-host',
      imports: [FormNodeDirective, FunctionValidatorCva],
      template: `<function-validator-cva [formNode]="name" />`,
    })
    class Host {
      readonly name = field('valid', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cva = fixture.debugElement.children[0]!.componentInstance as FunctionValidatorCva;
    cva.change('invalid');
    expect(fixture.componentInstance.name.getError('legacyFunction')?.kind).toBe('legacyFunction');
  });
});

describe('native control conversion', () => {
  it('recognizes only native form elements', () => {
    expect(isNativeFormNodeControl(document.createElement('input'))).toBe(true);
    expect(isNativeFormNodeControl(document.createElement('select'))).toBe(true);
    expect(isNativeFormNodeControl(document.createElement('textarea'))).toBe(true);
    expect(isNativeFormNodeControl(document.createElement('div'))).toBe(false);
  });

  it('reads text, fallback, checkbox, radio, and multiple-select values', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'notes';
    expect(readNativeControlValue(textarea, () => null)).toBe('notes');

    const email = document.createElement('input');
    email.type = 'email';
    email.value = 'a@example.com';
    expect(readNativeControlValue(email, () => null)).toBe('a@example.com');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    expect(readNativeControlValue(checkbox, () => false)).toBe(true);

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.value = 'Madrid';
    expect(readNativeControlValue(radio, () => 'Zurich')).toBe('Zurich');
    radio.checked = true;
    expect(readNativeControlValue(radio, () => 'Zurich')).toBe('Madrid');

    const select = document.createElement('select');
    select.multiple = true;
    select.append(new Option('Madrid', 'mad', true, true), new Option('Zurich', 'zrh', true, true));
    expect(readNativeControlValue(select, () => [])).toEqual(['mad', 'zrh']);
  });

  it('reads numeric controls according to the current model type', () => {
    for (const type of ['number', 'range', 'datetime-local']) {
      const input = document.createElement('input');
      input.type = type;
      input.value = type === 'datetime-local' ? '2026-08-27T12:30' : '42';
      expect(typeof readNativeControlValue(input, () => 0)).toBe('number');
      expect(readNativeControlValue(input, () => '0')).toBe(input.value);
      input.value = '';
      if (type === 'range') expect(readNativeControlValue(input, () => null)).toBe(50);
      else expect(readNativeControlValue(input, () => null)).toBeNull();
    }
  });

  it('reads date-like controls as Date, number, or string according to the model', () => {
    for (const [type, value] of [['date', '2026-08-27'], ['month', '2026-08'], ['time', '12:30'], ['week', '2026-W35']] as const) {
      const input = document.createElement('input');
      input.type = type;
      input.value = value;
      expect(readNativeControlValue(input, () => new Date())).toBeTruthy();
      expect(typeof readNativeControlValue(input, () => 0)).toBe('number');
      expect(readNativeControlValue(input, () => '')).toBe(value);
    }
  });

  it('parses numeric text while retaining the current value for invalid input', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = '42';
    expect(readNativeControlValue(input, () => 0)).toBe(42);
    expect(readNativeControlValue(input, () => '')).toBe('42');
    input.value = '';
    expect(readNativeControlValue(input, () => null)).toBeNull();
    input.value = 'invalid';
    expect(readNativeControlValue(input, () => 23)).toBe(23);
  });

  it('reports numeric text and browser bad-input parse failures', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = 'invalid';
    expect(parseNativeControlValue(input, () => 23)).toEqual({ error: { kind: 'parse' } });
    input.value = '42';
    expect(parseNativeControlValue(input, () => 23)).toEqual({ value: 42 });

    Object.defineProperty(input, 'validity', { configurable: true, value: { badInput: true } });
    expect(parseNativeControlValue(input, () => 23)).toEqual({ error: { kind: 'parse' } });
    Object.defineProperty(input, 'validity', { configurable: true, value: { badInput: false } });
    input.value = 'invalid';
    expect(parseNativeControlValue(input, () => null)).toEqual({ error: { kind: 'parse' } });
  });

  it('writes all supported native value representations', () => {
    const textarea = document.createElement('textarea');
    writeNativeControlValue(textarea, null);
    expect(textarea.value).toBe('');
    writeNativeControlValue(textarea, 'notes');
    expect(textarea.value).toBe('notes');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    writeNativeControlValue(checkbox, 1);
    expect(checkbox.checked).toBe(true);

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.value = 'Madrid';
    writeNativeControlValue(radio, 'Zurich');
    expect(radio.checked).toBe(false);
    writeNativeControlValue(radio, 'Madrid');
    expect(radio.checked).toBe(true);

    for (const type of ['number', 'range', 'datetime-local']) {
      const input = document.createElement('input');
      input.type = type;
      writeNativeControlValue(input, 42);
      expect(input.valueAsNumber).toBe(42);
      writeNativeControlValue(input, Number.NaN);
      if (type === 'range') expect(input.value).toBe('50');
      else expect(input.value).toBe('');
      writeNativeControlValue(input, null);
      if (type === 'range') expect(input.value).toBe('50');
      else expect(input.value).toBe('');
      writeNativeControlValue(input, type === 'datetime-local' ? '2026-08-27T12:30' : '12');
      expect(input.value).not.toBe('');
    }

    for (const type of ['date', 'month', 'time', 'week']) {
      const input = document.createElement('input');
      input.type = type;
      writeNativeControlValue(input, 0);
      expect(Number.isNaN(input.valueAsNumber)).toBe(false);
      writeNativeControlValue(input, null);
      expect(input.value).toBe('');
      writeNativeControlValue(input, undefined);
      expect(input.value).toBe('');
      const stringValue = type === 'date' ? '2026-08-27' : type === 'month' ? '2026-08' : type === 'time' ? '12:30' : '2026-W35';
      writeNativeControlValue(input, stringValue);
      expect(input.value).toBe(stringValue);
    }

    const email = document.createElement('input');
    email.type = 'email';
    writeNativeControlValue(email, null);
    expect(email.value).toBe('');

    const select = document.createElement('select');
    select.multiple = true;
    select.append(new Option('One', '1'), new Option('Two', '2'));
    writeNativeControlValue(select, [2]);
    expect(Array.from(select.selectedOptions, (option) => option.value)).toEqual(['2']);
    writeNativeControlValue(select, null);
    expect(select.selectedOptions).toHaveLength(0);
  });
});

describe('FormNodeNgControl', () => {
  it('projects field state through the Angular control compatibility surface', () => {
    const name = field('', [required], { nullable: false });
    const control = new FormNodeNgControl(() => name as Field<unknown>);

    expect(control.control).toBe(control);
    expect(control.value).toBe('');
    expect(control.valid).toBe(false);
    expect(control.invalid).toBe(true);
    expect(control.pending).toBe(false);
    expect(control.disabled).toBe(false);
    expect(control.enabled).toBe(true);
    expect(control.errors?.['required']).toMatchObject({ kind: 'required', targetNode: name });
    expect(control.pristine).toBe(true);
    expect(control.dirty).toBe(false);
    expect(control.touched).toBe(false);
    expect(control.untouched).toBe(true);
    expect(control.status).toBe('INVALID');
    expect(control.hasValidator(Validators.required)).toBe(true);
    expect(control.hasValidator(Validators.email)).toBe(false);

    name.setControlValue('David');
    name.markAsTouched();
    expect(control.value).toBe('David');
    expect(control.valid).toBe(true);
    expect(control.errors).toBeNull();
    expect(control.dirty).toBe(true);
    expect(control.pristine).toBe(false);
    expect(control.touched).toBe(true);
    expect(control.untouched).toBe(false);
    expect(control.status).toBe('VALID');

    name.disable();
    expect(control.disabled).toBe(true);
    expect(control.enabled).toBe(false);
    expect(control.status).toBe('DISABLED');
    expect(() => control.updateValueAndValidity()).not.toThrow();
  });

  it('reports pending when no terminal validation status is available', () => {
    const pendingField = {
      disabled: () => false,
      valid: () => false,
      invalid: () => false,
      pending: () => true,
    } as unknown as Field<unknown>;
    expect(new FormNodeNgControl(() => pendingField).status).toBe('PENDING');
  });
});
