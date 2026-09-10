import '@angular/compiler';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { Component, forwardRef, signal } from '@angular/core';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FormControl, FormGroup, FormGroupDirective, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators, type ControlValueAccessor } from '@angular/forms';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { required } from '../validation/validators/required';
import { FormNodeErrors } from './form-node-errors.component';
import { FormNodeDirective } from '../form-node/form-node.directive';
import { useFormNodeState } from '../form-node-state/form-node-state';
import { registerErrorTemplateQueryForJit } from '../../../tests/helpers/register-error-template-query-for-jit';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerErrorTemplateQueryForJit();

for (const name of ['node', 'state', 'showWhen', 'maxMessages', 'animate', 'message', 'fallbackMessage']) {
  registerSignalInputForJit(FormNodeErrors, name, name);
}
registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');

@Component({
  selector: 'custom-error-control',
  template: `
    <input [value]="value()" (input)="edit($event)" (blur)="state.markAsTouched()"
      aria-describedby="custom-errors" [attr.aria-invalid]="state.invalid()" />
    <form-node-errors id="custom-errors" [state]="state" [animate]="false" />
  `,
  imports: [FormNodeErrors],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CustomControl), multi: true }],
})
class CustomControl implements ControlValueAccessor {
  value = signal('');

  localIssue = signal<string | null>(null);

  state = useFormNodeState({ errors: () => this.localIssue() });

  change: (value: string) => void = () => {};

  writeValue(value: string) { this.value.set(value); }

  registerOnChange(change: (value: string) => void) { this.change = change; }

  registerOnTouched(_touch: () => void) {}

  edit(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.change(value);
  }
}

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterEach(() => TestBed.resetTestingModule());
afterAll(() => TestBed.resetTestEnvironment());

describe('error display in browsers', () => {
  it('animates measured height from zero, between message counts, and back to zero', async () => {
    const node = field('', { validators: () => [
      { kind: 'a', message: 'A message long enough to wrap onto several lines inside a narrow input container.' },
      { kind: 'b', message: 'Another message.' },
    ] });
    const fixture = TestBed.createComponent(FormNodeErrors);
    fixture.componentRef.setInput('node', node);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    host.style.width = '140px';
    expect(host.getBoundingClientRect().height).toBe(0);
    node.markAsTouched();
    fixture.detectChanges();
    const entry = host.getAnimations()[0]!;
    expect(entry).toBeDefined();
    const frames = (entry.effect as KeyframeEffect).getKeyframes();
    expect(frames[0]!.height).toBe('0px');
    expect(parseFloat(frames[1]!.height as string)).toBeGreaterThan(20);
    await entry.finished;
    const firstHeight = host.getBoundingClientRect().height;
    fixture.componentRef.setInput('maxMessages', 2);
    fixture.detectChanges();
    const expansion = host.getAnimations()[0]!;
    expect(expansion).toBeDefined();
    await expansion.finished;
    expect(host.getBoundingClientRect().height).toBeGreaterThan(firstHeight);
    const expandedHeight = host.getBoundingClientRect().height;
    host.style.width = '400px';
    await expect.poll(() => host.getAnimations().length).toBe(1);
    await host.getAnimations()[0]!.finished;
    expect(host.getBoundingClientRect().height).toBeLessThan(expandedHeight);
    node.reset();
    fixture.detectChanges();
    expect(host.textContent?.trim()).toBe('');
    const exit = host.getAnimations()[0]!;
    expect((exit.effect as KeyframeEffect).getKeyframes()[1]!.height).toBe('0px');
    await exit.finished;
    expect(host.getBoundingClientRect().height).toBe(0);
    expect(host.getAttribute('aria-live')).toBe('polite');
  });

  it('uses a red default, supports a local color override and animates custom template height', async () => {
    @Component({
      template: `
        <form-node-errors [node]="email">
          <ng-template #message let-text><span class="custom-message">{{ text }}</span></ng-template>
        </form-node-errors>
      `,
      styles: '.custom-message { display: block; padding: 12px; border: 1px solid currentColor; }',
      imports: [FormNodeErrors],
    })
    class Host {
      email = field('', [required]);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const element = fixture.nativeElement.querySelector('form-node-errors') as HTMLElement;
    expect(getComputedStyle(element).color).toBe('rgb(220, 38, 38)');
    fixture.componentInstance.email.markAsTouched();
    fixture.detectChanges();
    const message = element.querySelector('.custom-message') as HTMLElement;
    expect(getComputedStyle(message).color).toBe('rgb(220, 38, 38)');
    expect(message.getBoundingClientRect().height).toBeGreaterThan(26);
    const animation = element.getAnimations()[0]!;
    expect(parseFloat((animation.effect as KeyframeEffect).getKeyframes()[1]!.height as string)).toBe(message.getBoundingClientRect().height);
    await animation.finished;
    element.style.setProperty('--form-node-errors-color', '#be123c');
    expect(getComputedStyle(message).color).toBe('rgb(190, 18, 60)');
    fixture.componentInstance.email.set('valid');
    fixture.detectChanges();
    await element.getAnimations()[0]!.finished;
    expect(element.getBoundingClientRect().height).toBe(0);
  });

  it('scales default and projected messages with root text size and inherited typography overrides', () => {
    @Component({
      template: `
        <section style="width: 180px; font-size: 20px;">
          <form-node-errors [node]="email" showWhen="always" [animate]="false" />
          <form-node-errors [node]="email" showWhen="always" [animate]="false">
            <ng-template #message let-text><span>{{ text }}</span></ng-template>
          </form-node-errors>
        </section>
      `,
      imports: [FormNodeErrors],
    })
    class Host {
      email = field('', [required('Enter an email address so we can send your confirmation.')]);
    }
    const root = document.documentElement;
    const originalSize = root.style.fontSize;
    try {
      root.style.fontSize = '16px';
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const section = fixture.nativeElement.querySelector('section') as HTMLElement;
      const errors = Array.from(section.querySelectorAll('form-node-errors')) as HTMLElement[];
      const heights = errors.map(element => element.getBoundingClientRect().height);
      for (const element of errors) {
        expect(getComputedStyle(element).fontSize).toBe('14px');
        expect(getComputedStyle(element).lineHeight).toBe('21px');
        expect(getComputedStyle(element.querySelector('.form-node-errors-content')!.firstElementChild!).fontSize).toBe('14px');
      }

      root.style.fontSize = '32px';
      fixture.detectChanges();
      errors.forEach((element, index) => {
        expect(getComputedStyle(element).fontSize).toBe('28px');
        expect(getComputedStyle(element).lineHeight).toBe('42px');
        expect(element.getBoundingClientRect().height).toBeGreaterThan(heights[index]!);
        expect(element.scrollHeight).toBeLessThanOrEqual(element.clientHeight);
        expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth);
      });

      root.style.fontSize = '16px';
      section.style.setProperty('--form-node-errors-font-size', '1rem');
      section.style.setProperty('--form-node-errors-line-height', '1.75');
      for (const element of errors) {
        expect(getComputedStyle(element).fontSize).toBe('16px');
        expect(getComputedStyle(element).lineHeight).toBe('28px');
      }
      errors[0]!.style.setProperty('--form-node-errors-font-size', '1.125rem');
      expect(getComputedStyle(errors[0]!).fontSize).toBe('18px');
      expect(getComputedStyle(errors[1]!).fontSize).toBe('16px');
    } finally {
      root.style.fontSize = originalSize;
    }
  });

  it('recovers from bad display configuration without changing the node or interrupting rendering', async () => {
    const node = field('', [required]);
    node.markAsTouched();
    const fixture = TestBed.createComponent(FormNodeErrors);
    fixture.componentRef.setInput('node', node);
    fixture.componentRef.setInput('state', {});
    fixture.componentRef.setInput('maxMessages', -1);
    fixture.componentRef.setInput('message', () => { throw new Error('Bad formatter'); });
    fixture.componentRef.setInput('animate', 'invalid');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent?.trim()).toBe('');
    expect(host.getBoundingClientRect().height).toBe(0);
    fixture.componentRef.setInput('state', undefined);
    fixture.componentRef.setInput('maxMessages', 1);
    fixture.detectChanges();
    expect(host.textContent?.trim()).toBe('This field is required.');
    expect(host.getAnimations()).toHaveLength(1);
    await host.getAnimations()[0]!.finished;
    expect(node()).toBe('');
    expect(node.invalid()).toBe(true);
    expect(node.dirty()).toBe(false);
    fixture.componentRef.setInput('maxMessages', NaN);
    fixture.detectChanges();
    await host.getAnimations()[0]!.finished;
    expect(host.getBoundingClientRect().height).toBe(0);
  });

  it('can turn animation off during entry and remains correct after destruction', () => {
    const node = field('', [required]);
    const fixture = TestBed.createComponent(FormNodeErrors);
    fixture.componentRef.setInput('node', node);
    fixture.componentRef.setInput('showWhen', 'always');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAnimations()).toHaveLength(1);
    fixture.componentRef.setInput('animate', false);
    fixture.detectChanges();
    expect(host.getAnimations()).toHaveLength(0);
    expect(host.getBoundingClientRect().height).toBeGreaterThan(0);
    node.set('valid');
    fixture.detectChanges();
    expect(host.getBoundingClientRect().height).toBe(0);
    fixture.destroy();
    node.set('');
    expect(host.getAnimations()).toHaveLength(0);
  });

  it('observes the owning form and component errors inside a CVA, including rebinding', async () => {
    @Component({
      template: `<custom-error-control [formNode]="active()" />`,
      imports: [CustomControl, FormNodeDirective],
    })
    class Host {
      first = form({ name: field('', [required]) });
      second = form({ name: field('valid') });
      active = signal(this.first.name);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const control = fixture.debugElement.query(By.directive(CustomControl)).componentInstance as CustomControl;
    const errors = fixture.nativeElement.querySelector('form-node-errors') as HTMLElement;
    expect(control.state.form.formNode()).toBe(host.first.$api);
    expect(errors.textContent?.trim()).toBe('');
    await host.first.submit();
    fixture.detectChanges();
    expect(control.state.formSubmitted()).toBe(true);
    expect(errors.textContent).toContain('This field is required.');
    host.first.name.set('valid');
    control.localIssue.set('Invalid date');
    fixture.detectChanges();
    expect(errors.textContent).toContain('Invalid date');
    expect(host.first.invalid()).toBe(true);
    host.active.set(host.second.name);
    fixture.detectChanges();
    expect(control.state.form.formNode()).toBe(host.second.$api);
    expect(control.state.formSubmitted()).toBe(false);
    expect(errors.textContent?.trim()).toBe('');
    expect(host.first.valid()).toBe(true);
    fixture.nativeElement.querySelector('input').dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(errors.textContent).toContain('Invalid date');
    host.second.reset();
    fixture.detectChanges();
    expect(errors.textContent?.trim()).toBe('');
  });

  it('shows Angular Reactive Forms errors on submission without requiring touched', async () => {
    @Component({
      template: `<form [formGroup]="form"><custom-error-control formControlName="name" /></form>`,
      imports: [CustomControl, ReactiveFormsModule],
    })
    class Host {
      form = new FormGroup({ name: new FormControl('', Validators.required) });
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    const control = fixture.debugElement.query(By.directive(CustomControl)).componentInstance as CustomControl;
    const errors = fixture.nativeElement.querySelector('form-node-errors') as HTMLElement;
    expect(control.state.form.source()).toBe('formGroup');
    expect(errors.textContent?.trim()).toBe('');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(control.state.touched()).toBe(false);
    expect(control.state.formSubmitted()).toBe(true);
    expect(errors.textContent).toContain('Invalid value.');
    const directive = fixture.debugElement.query(By.directive(FormGroupDirective)).injector.get(FormGroupDirective);
    directive.resetForm();
    await Promise.resolve();
    fixture.detectChanges();
    expect(control.state.formSubmitted()).toBe(false);
    expect(errors.textContent?.trim()).toBe('');
  });
});
