import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { CSP_NONCE, Component, ViewEncapsulation, forwardRef, type OnDestroy } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { field } from '../../primitives/field';
import { FormNodeDirective } from './form-node.directive';
import { required } from '../../validation/validators/required';

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

const dispatch = (element: HTMLElement, type: string): void => {
  element.dispatchEvent(new Event(type, { bubbles: true }));
};

describe('FormNodeDirective in Chromium', () => {
  it('synchronizes a native text input, IME composition, and interaction state', () => {
    @Component({
      standalone: true,
      selector: 'browser-text-form-node-host',
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
    fixture.destroy();
  });

  it('reflects validation, readonly, and disabled state onto a native control', () => {
    @Component({
      standalone: true,
      selector: 'browser-state-form-node-host',
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
    fixture.destroy();
  });

  it('uses browser-native number, checkbox, radio, and select semantics', async () => {
    @Component({
      standalone: true,
      selector: 'browser-native-form-node-host',
      imports: [FormNodeDirective],
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

  it('commits control values after a real browser debounce timer', async () => {
    @Component({
      standalone: true,
      selector: 'browser-debounce-form-node-host',
      imports: [FormNodeDirective],
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

  it('retains invalid numeric text until a valid value or reset resolves the parse error', () => {
    @Component({
      standalone: true,
      selector: 'browser-parse-form-node-host',
      imports: [FormNodeDirective],
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
      imports: [FormNodeDirective],
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

  it('installs and removes native validity monitoring inside Shadow DOM', () => {
    @Component({
      standalone: true,
      selector: 'browser-shadow-validity-form-node-host',
      imports: [FormNodeDirective],
      encapsulation: ViewEncapsulation.ShadowDom,
      template: `<input type="date" [formNode]="date">`,
    })
    class Host {
      readonly date = field('2026-08-29', { nullable: false });
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const shadowRoot = (fixture.nativeElement as HTMLElement).shadowRoot!;
    expect(Array.from(shadowRoot.querySelectorAll('style')).some((style) =>
      style.textContent?.includes('@keyframes form-node-valid'),
    )).toBe(true);

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
      writeValue(value: string): void { this.value = value; }
      registerOnChange(callback: (value: string) => void): void { this.change = callback; }
      registerOnTouched(callback: () => void): void { this.touch = callback; }
      setDisabledState(disabled: boolean): void { this.disabled = disabled; }
      select(): void { this.change('Mark'); }
      ngOnDestroy(): void { this.destroyed = true; }
    }

    @Component({
      standalone: true,
      selector: 'browser-cva-form-node-host',
      imports: [BrowserCva, FormNodeDirective],
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
      writeValue(value: string): void {
        this.value = value;
        this.change(value);
      }
      registerOnChange(callback: (value: string) => void): void { this.change = callback; }
      registerOnTouched(): void {}
    }

    @Component({
      standalone: true,
      selector: 'browser-echoing-cva-host',
      imports: [EchoingCva, FormNodeDirective],
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
