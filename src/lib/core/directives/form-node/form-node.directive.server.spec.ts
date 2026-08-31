import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import type { FormValueControl } from '@angular/forms/signals';
import { bootstrapApplication } from '@angular/platform-browser';
import { Component, forwardRef, input, model, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { provideServerRendering, renderApplication } from '@angular/platform-server';

import { field } from '../../primitives/field';
import { FormNodeDirective } from './form-node.directive';
import { required } from '../../validation/validators/required';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../../../testing/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', 'formNodeInput');

@Component({
  selector: 'test-control',
  standalone: true,
  template: '<span>{{ value() }}</span><span>{{ disabled() }}</span>',
  providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => TestControl) }],
})
class TestControl implements ControlValueAccessor {
  readonly value = signal('');
  readonly disabled = signal(false);

  writeValue(value: unknown) { this.value.set(String(value)); }
  registerOnChange(_onChange: (value: unknown) => void) {}
  registerOnTouched(_onTouched: () => void) {}
  setDisabledState(disabled: boolean) { this.disabled.set(disabled); }
}

@Component({
  selector: 'test-signal-control',
  standalone: true,
  template: '<span>{{ value() }}</span><span>{{ required() }}</span>',
})
class TestSignalControl implements FormValueControl<string> {
  value = model('');
  required = input(false);
}

registerSignalModelForJit(TestSignalControl, 'value');
registerSignalInputForJit(TestSignalControl, 'required', 'required');

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
    expect(html).toMatch(/name="[^".]+\.form\d+"/);
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

  it('renders date-like controls without installing browser validity monitoring', async () => {
    @Component({
      selector: 'app-root',
      standalone: true,
      imports: [FormNodeDirective],
      template: '<input type="date" [formNode]="date">',
    })
    class App {
      readonly date = field('2026-08-29');
    }

    const html = await render(App);

    expect(html).toContain('value="2026-08-29"');
    expect(html).not.toContain('form-node-valid');
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

  it('renders through an automatically discovered signal custom control', async () => {
    @Component({
      selector: 'app-root',
      standalone: true,
      imports: [TestSignalControl, FormNodeDirective],
      template: '<test-signal-control [formNode]="name"></test-signal-control>',
    })
    class App {
      name = field('Marco', [required], { nullable: false });
    }

    const html = await render(App);

    expect(html).toContain('<span>Marco</span><span>true</span>');
  });
});
