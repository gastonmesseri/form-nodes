// @vitest-environment jsdom

import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { Component, forwardRef, inject, signal } from '@angular/core';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, NgControl, type AbstractControl, type ControlValueAccessor, type ValidationErrors, type Validator } from '@angular/forms';

import { field } from '../../primitives/field';
import { FormNodeDirective } from './form-node';
import { required } from '../../validation/validators/required';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

const dispatch = (element: HTMLElement, type: string): void => {
  element.dispatchEvent(new Event(type, { bubbles: true }));
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

    madrid!.checked = true;
    dispatch(madrid!, 'change');
    fixture.detectChanges();

    expect(fixture.componentInstance.city()).toBe('Madrid');
    expect(madrid!.checked).toBe(true);
    expect(zurich!.checked).toBe(false);
  });

  it('supports single and multiple native selects', () => {
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
      writeValue(value: unknown): void { this.value = value; }
      registerOnChange(callback: (value: unknown) => void): void { this.change = callback; }
      registerOnTouched(callback: () => void): void { this.touch = callback; }
      setDisabledState(disabled: boolean): void { this.disabled = disabled; }
      validate(_control: AbstractControl): ValidationErrors | null {
        return this.rejectValue ? { customCva: { rejected: true } } : null;
      }
      registerOnValidatorChange(callback: () => void): void { this.validatorChange = callback; }
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
});
