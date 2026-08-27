import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { Component, forwardRef, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';

import { field } from '../../primitives/field';
import { required } from '../../validation/validators/required';
import { FormNodeDirective } from './form-node.directive';

@Component({
  selector: 'test-control',
  standalone: true,
  template: '<span>{{ value() }}</span><span>{{ disabled() }}</span>',
  providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => TestControl) }],
})
class TestControl implements ControlValueAccessor {
  readonly value = signal('');
  readonly disabled = signal(false);

  writeValue(value: unknown): void { this.value.set(String(value)); }
  registerOnChange(_onChange: (value: unknown) => void): void {}
  registerOnTouched(_onTouched: () => void): void {}
  setDisabledState(disabled: boolean): void { this.disabled.set(disabled); }
}

const render = (component: Parameters<typeof bootstrapApplication>[0]): Promise<string> =>
  renderApplication(
    (context) => bootstrapApplication(component, { providers: [provideServerRendering()] }, context),
    { document: '<app-root></app-root>', url: '/' },
  );

describe('FormNodeDirective server rendering', () => {
  it('renders a native input value and node state without browser globals', async () => {
    @Component({
      selector: 'app-root',
      standalone: true,
      imports: [FormNodeDirective],
      template: '<input [formNode]="name">',
    })
    class App {
      readonly name = field('', [required]);
    }

    const html = await render(App);

    expect(html).toContain('value=""');
    expect(html).toContain('required=""');
    expect(html).toContain('aria-invalid="true"');
  });

  it('renders select values without requiring MutationObserver', async () => {
    @Component({
      selector: 'app-root',
      standalone: true,
      imports: [FormNodeDirective],
      template: '<select [formNode]="country"><option value="ES">Spain</option><option value="CH">Switzerland</option></select>',
    })
    class App {
      readonly country = field('CH');
    }

    const html = await render(App);

    expect(html).toContain('<option value="CH">Switzerland</option>');
    expect(html).toContain('aria-invalid="false"');
  });

  it('renders through a custom ControlValueAccessor', async () => {
    @Component({
      selector: 'app-root',
      standalone: true,
      imports: [TestControl, FormNodeDirective],
      template: '<test-control [formNode]="name"></test-control>',
    })
    class App {
      readonly name = field('Marco');
    }

    const html = await render(App);

    expect(html).toContain('<span>Marco</span><span>false</span>');
  });
});
