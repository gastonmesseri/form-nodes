import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import type { FormValueControl } from '@angular/forms/signals';
import { bootstrapApplication } from '@angular/platform-browser';
import { Component, forwardRef, input, model, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { provideServerRendering, renderApplication } from '@angular/platform-server';

import { field } from '../primitives/field';
import { FormNode } from './form-node.directive';
import { required } from '../validation/validators/required';
import { registerSignalInputForJit, registerSignalModelForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');

@Component({
  selector: 'test-control',
  template: '<span>{{ value() }}</span><span>{{ disabled() }}</span><span>{{ name() }}</span>',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => TestControl) }],
})
class TestControl implements ControlValueAccessor {
  readonly value = signal('');
  readonly disabled = signal(false);
  name = input('');

  writeValue(value: unknown) { this.value.set(String(value)); }
  registerOnChange(_onChange: (value: unknown) => void) {}
  registerOnTouched(_onTouched: () => void) {}
  setDisabledState(disabled: boolean) { this.disabled.set(disabled); }
}
registerSignalInputForJit(TestControl, 'name', 'name');

@Component({
  selector: 'test-signal-control',
  template: '<span>{{ value() }}</span><span>{{ required() }}</span>',
  standalone: true,
})
class TestSignalControl implements FormValueControl<string> {
  value = model('');
  required = input(false);
}

registerSignalModelForJit(TestSignalControl, 'value');
registerSignalInputForJit(TestSignalControl, 'required', 'required');

const render = (component: Parameters<typeof bootstrapApplication>[0]): Promise<string> => {
  return renderApplication(
    context => bootstrapApplication(component, { providers: [provideServerRendering()] }, context),
    { document: '<app-root></app-root>', url: '/' },
  );
};

describe('FormNode server rendering', () => {
  it('renders a native input value and node state without browser globals', async () => {
    @Component({
      selector: 'app-root',
      template: '<input [formNode]="name">',
      standalone: true,
      imports: [FormNode],
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
      template: '<select [formNode]="country"><option value="ES">Spain</option><option value="CH">Switzerland</option></select>',
      standalone: true,
      imports: [FormNode],
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
      template: '<input type="date" [formNode]="date">',
      standalone: true,
      imports: [FormNode],
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
      template: '<test-control [formNode]="name" />',
      standalone: true,
      imports: [TestControl, FormNode],
    })
    class App {
      readonly name = field('Marco', { syncInputs: 'always' });
    }

    const html = await render(App);

    expect(html).toContain('<span>Marco</span><span>false</span>');
    expect(html).toMatch(/<span>[^<.]+\.form\d+<\/span>/);
  });

  it.each([false, true, 'always'] as const)('renders a signal control with syncInputs=%s', async (syncInputs) => {
    @Component({
      selector: 'app-root',
      template: '<test-signal-control [formNode]="name" />',
      standalone: true,
      imports: [TestSignalControl, FormNode],
    })
    class App {
      name = field.strict('Marco', [required], { syncInputs });
    }

    const html = await render(App);

    expect(html).toContain(`<span>Marco</span><span>${syncInputs === 'always'}</span>`);
  });
});
