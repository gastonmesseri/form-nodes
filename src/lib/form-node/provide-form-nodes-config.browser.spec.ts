import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Component, forwardRef, input, model, output, signal } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import type { AnyNode } from '../types/node.type';
import { FormNodeDirective } from './form-node.directive';
import { required } from '../validation/validators/required';
import { configureGlobalFormNodes } from '../configuration/configure-global-form-nodes';
import { provideFormNodesConfig, type FormNodesConfig } from './provide-form-nodes-config';
import { registerSignalInputForJit, registerSignalModelForJit, registerSignalOutputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNodeDirective, 'formNode', '_formNodeInput');

@Component({ selector: 'config-value-control', template: '' })
class ValueControl {
  value = model<unknown>('');

  disabled = input(true);

  required = input(false);

  readOnly = input(true, { alias: 'readonly' });

  touch = output<void>();

  resets = 0;

  reset() { this.resets++; }
}

@Component({ selector: 'config-checkbox-control', template: '' })
class CheckboxControl {
  checked = model(false);

  disabled = input(true);
}

@Component({
  selector: 'config-cva-control',
  template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CvaControl), multi: true }],
})
class CvaControl implements ControlValueAccessor {
  value = model<unknown>('owned');

  rendered: unknown;

  change: (value: unknown) => void = () => {};

  touch: () => void = () => {};

  readonly = input(true);

  disabled = false;

  writeValue(value: unknown) { this.rendered = value; }

  registerOnChange(callback: (value: unknown) => void) { this.change = callback; }

  registerOnTouched(callback: () => void) { this.touch = callback; }

  setDisabledState(value: boolean) { this.disabled = value; }
}

registerSignalModelForJit(CvaControl, 'value');
registerSignalModelForJit(ValueControl, 'value');
registerSignalInputForJit(ValueControl, 'disabled', 'disabled');
registerSignalInputForJit(ValueControl, 'required', 'required');
registerSignalInputForJit(ValueControl, 'readonly', 'readOnly');
registerSignalOutputForJit(ValueControl, 'touch', 'touch');
registerSignalModelForJit(CheckboxControl, 'checked');
registerSignalInputForJit(CheckboxControl, 'disabled', 'disabled');
registerSignalInputForJit(CvaControl, 'readonly', 'readonly');

beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
const restoreGlobalConfig: (() => void)[] = [];
afterEach(() => {
  TestBed.resetTestingModule();
  restoreGlobalConfig.splice(0).reverse().forEach(restore => restore());
});
afterAll(() => TestBed.resetTestEnvironment());

describe('custom-control input configuration', () => {
  it.each(['field', 'form'] as const)('preserves consumer inputs while synchronizing a %s and checkbox', (kind) => {
    @Component({
      template: `
        <config-value-control [formNode]="current()" [disabled]="saving()" [readonly]="saving()" />
        <config-checkbox-control [formNode]="profile.active" />
      `,
      imports: [FormNodeDirective, ValueControl, CheckboxControl],
      providers: [provideFormNodesConfig({ syncInputs: false })],
    })
    class Host {
      profile = form({ name: field('Mark'), active: field(false) });

      current = signal<AnyNode>(kind === 'field' ? this.profile.name : form({ name: field('Mark') }));

      saving = signal(true);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const control = fixture.debugElement.children[0]!.componentInstance as ValueControl;
    const checkbox = fixture.debugElement.children[1]!.componentInstance as CheckboxControl;
    const node = host.current();
    expect(control.disabled()).toBe(true);
    expect(control.readOnly()).toBe(true);
    expect(control.value()).toEqual(kind === 'field' ? 'Mark' : { name: 'Mark' });
    expect(checkbox.checked()).toBe(false);
    expect(checkbox.disabled()).toBe(true);

    const edited = kind === 'field' ? 'Jane' : { name: 'Jane' };
    control.value.set(edited);
    checkbox.checked.set(true);
    control.touch.emit();
    fixture.detectChanges();
    expect(node()).toEqual(edited);
    expect(node.$api.dirty()).toBe(true);
    expect(node.$api.touched()).toBe(true);
    expect(host.profile.active()).toBe(true);
    expect(host.profile.dirty()).toBe(true);

    node.$api.disable();
    node.$api.markAsReadonly();
    host.saving.set(false);
    fixture.detectChanges();
    expect(control.disabled()).toBe(false);
    expect(control.readOnly()).toBe(false);
    expect(node.$api.disabled()).toBe(true);
    node.$api.reset(kind === 'field' ? 'Mark' : { name: 'Mark' });
    fixture.detectChanges();
    expect(control.value()).toEqual(kind === 'field' ? 'Mark' : { name: 'Mark' });
    expect(control.resets).toBe(1);
    expect(node.$api.touched()).toBe(false);

    const replacement = kind === 'field' ? field('New') : form({ name: field('New') });
    host.current.set(replacement);
    fixture.detectChanges();
    expect(control.value()).toEqual(kind === 'field' ? 'New' : { name: 'New' });
    control.value.set(kind === 'field' ? 'Later' : { name: 'Later' });
    expect(replacement()).toEqual(kind === 'field' ? 'Later' : { name: 'Later' });
    expect(node()).toEqual(kind === 'field' ? 'Mark' : { name: 'Mark' });
    fixture.destroy();
    control.value.set('detached');
    expect(replacement()).toEqual(kind === 'field' ? 'Later' : { name: 'Later' });
  });

  describe.each(['field', 'form'] as const)('%s option inheritance', (kind) => {
    it.each(['classes', 'clearClasses', 'syncTrue', 'syncFalse', 'messages', 'empty', 'nullClasses', 'nullSync', 'nullMessages', 'allNull', 'undefined'] as const)('overrides only %s and keeps reactive state and value binding', (option) => {
      TestBed.configureTestingModule({ providers: [
        provideFormNodesConfig({ validatorMessages: { required: 'Root required' } }),
        provideFormNodesConfig({ classes: { 'root-invalid': binding => binding.node().$api.invalid() } }),
        provideFormNodesConfig({ syncInputs: option === 'syncFalse' ? 'all' : false }),
      ] });
      const options: Record<typeof option, FormNodesConfig> = {
        classes: { classes: { 'local-invalid': binding => binding.node().$api.invalid() } },
        clearClasses: { classes: {} },
        syncTrue: { syncInputs: 'all' },
        syncFalse: { syncInputs: false },
        messages: { validatorMessages: { required: 'Local required' } },
        empty: {},
        nullClasses: { classes: null },
        nullSync: { syncInputs: null },
        nullMessages: { validatorMessages: null },
        allNull: { classes: null, syncInputs: null, validatorMessages: null },
        undefined: { classes: undefined, syncInputs: undefined, validatorMessages: undefined },
      };
      @Component({
        template: '<config-value-control [formNode]="node" />',
        imports: [FormNodeDirective, ValueControl],
        providers: [provideFormNodesConfig(options[option])],
      })
      class Host {
        profile = form({ name: field('', [required]) });

        node = kind === 'field' ? this.profile.name : this.profile;
      }
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const host = fixture.componentInstance;
      const element = fixture.debugElement.children[0]!;
      const control = element.componentInstance as ValueControl;
      const classes = (element.nativeElement as HTMLElement).classList;
      expect(host.profile.name.getError('required')?.message).toBe(option === 'messages' ? 'Local required' : option === 'nullMessages' || option === 'allNull' ? 'This field is required.' : 'Root required');
      expect(classes.contains('root-invalid')).toBe(!['classes', 'clearClasses', 'nullClasses', 'allNull'].includes(option));
      expect(classes.contains('local-invalid')).toBe(option === 'classes');
      expect(control.disabled()).toBe(option !== 'syncTrue');
      expect(control.value()).toEqual(kind === 'field' ? '' : { name: '' });
      control.value.set(kind === 'field' ? 'Marco' : { name: 'Marco' });
      control.touch.emit();
      fixture.detectChanges();
      expect(host.profile.name()).toBe('Marco');
      expect(host.node.$api.valid()).toBe(true);
      expect(host.node.$api.dirty()).toBe(true);
      expect(host.node.$api.touched()).toBe(true);
      expect(classes.contains('root-invalid')).toBe(false);
      expect(classes.contains('local-invalid')).toBe(false);
      host.node.$api.disable();
      fixture.detectChanges();
      expect(control.disabled()).toBe(true);
      host.node.$api.enable();
      fixture.detectChanges();
      expect(control.disabled()).toBe(option !== 'syncTrue');
      host.profile.reset({ name: '' });
      fixture.detectChanges();
      expect(host.node.$api.touched()).toBe(false);
      expect(control.value()).toEqual(kind === 'field' ? '' : { name: '' });
      expect(classes.contains('root-invalid')).toBe(!['classes', 'clearClasses', 'nullClasses', 'allNull'].includes(option));
      expect(classes.contains('local-invalid')).toBe(option === 'classes');
    });
  });

  describe.each(['field', 'form'] as const)('%s global defaults', (kind) => {
    it.each(['none', 'classes', 'sync', 'messages', 'reset', 'undefined'] as const)('applies global defaults below a %s provider and snapshots binding options', (override) => {
      const showClass = signal(true);
      const restore = configureGlobalFormNodes({
        classes: { 'global-invalid': binding => showClass() && binding.node().$api.invalid() },
        syncInputs: false,
        validatorMessages: { required: 'Global required' },
      });
      restoreGlobalConfig.push(restore);
      const options: Record<typeof override, FormNodesConfig> = {
        none: {},
        classes: { classes: { 'local-invalid': binding => binding.node().$api.invalid() } },
        sync: { syncInputs: 'all' },
        messages: { validatorMessages: { required: 'Local required' } },
        reset: { classes: null, syncInputs: null, validatorMessages: null },
        undefined: { classes: undefined, syncInputs: undefined, validatorMessages: undefined },
      };
      @Component({
        template: '<config-value-control [formNode]="node" />',
        imports: [FormNodeDirective, ValueControl],
        providers: [provideFormNodesConfig(options[override])],
      })
      class Host {
        profile = form({ name: field('', [required]) });

        node = kind === 'field' ? this.profile.name : this.profile;
      }
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const host = fixture.componentInstance;
      const element = fixture.debugElement.children[0]!;
      const control = element.componentInstance as ValueControl;
      const classes = (element.nativeElement as HTMLElement).classList;
      const inheritedClass = override !== 'classes' && override !== 'reset';
      expect(classes.contains('global-invalid')).toBe(inheritedClass);
      expect(classes.contains('local-invalid')).toBe(override === 'classes');
      expect(control.disabled()).toBe(override !== 'sync');
      expect(host.profile.name.getError('required')?.message).toBe(override === 'messages' ? 'Local required' : 'Global required');
      showClass.set(false);
      fixture.detectChanges();
      expect(classes.contains('global-invalid')).toBe(false);
      showClass.set(true);
      restore();
      fixture.detectChanges();
      expect(classes.contains('global-invalid')).toBe(inheritedClass);
      expect(control.disabled()).toBe(override !== 'sync');
      expect(host.profile.name.getError('required')?.message).toBe(override === 'messages' ? 'Local required' : 'This field is required.');
      control.value.set(kind === 'field' ? 'Marco' : { name: 'Marco' });
      control.touch.emit();
      fixture.detectChanges();
      expect(host.profile.name()).toBe('Marco');
      expect(host.node.$api.touched()).toBe(true);
      expect(classes.contains('global-invalid')).toBe(false);
      expect(classes.contains('local-invalid')).toBe(false);
      const later = TestBed.createComponent(Host);
      later.detectChanges();
      const laterElement = later.debugElement.children[0]!;
      expect((laterElement.nativeElement as HTMLElement).classList.contains('global-invalid')).toBe(false);
      expect((laterElement.componentInstance as ValueControl).disabled()).toBe(override !== 'sync');
    });
  });

  describe.each(['field', 'form'] as const)('%s declared input selection', (kind) => {
    it.each([
      { inputs: ['disabled', 'readonly'] },
      { inputs: 'declared' },
    ] as const)('applies selected public input names and aliases with %j', (selection) => {
      @Component({
        template: '<config-value-control [formNode]="node" />',
        imports: [FormNodeDirective, ValueControl],
        providers: [provideFormNodesConfig({ syncInputs: selection })],
      })
      class Host {
        node = kind === 'field'
          ? field('', [required], { disabled: false })
          : form({ name: field('') }, [required], { disabled: false });
      }
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const node = fixture.componentInstance.node;
      const control = fixture.debugElement.children[0]!.componentInstance as ValueControl;
      expect(control.disabled()).toBe(false);
      expect(control.required()).toBe(false);
      expect(control.readOnly()).toBe(selection.inputs === 'declared');
      node.$api.disable();
      fixture.detectChanges();
      expect(control.disabled()).toBe(true);
      node.$api.enable();
      control.value.set(kind === 'field' ? 'Marco' : { name: 'Marco' });
      fixture.detectChanges();
      expect(node()).toEqual(kind === 'field' ? 'Marco' : { name: 'Marco' });
      expect(control.disabled()).toBe(false);
      expect(control.required()).toBe(false);
    });

    it.each([false, 'declared', 'all', 'signal-controls'] as const)('keeps value and touch binding with mode %s', (syncInputs) => {
      @Component({
        template: '<config-value-control [formNode]="node" />',
        imports: [FormNodeDirective, ValueControl],
      })
      class Host {
        node = kind === 'field'
          ? field('', [required], { syncInputs, disabled: false })
          : form({ name: field('') }, [required], { syncInputs, disabled: false });
      }
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      const node = fixture.componentInstance.node;
      const control = fixture.debugElement.children[0]!.componentInstance as ValueControl;
      expect(control.disabled()).toBe(syncInputs === false);
      expect(control.required()).toBe(syncInputs === 'all' || syncInputs === 'signal-controls');
      expect(control.readOnly()).toBe(syncInputs !== 'all' && syncInputs !== 'signal-controls');
      control.value.set(kind === 'field' ? 'Marco' : { name: 'Marco' });
      control.touch.emit();
      fixture.detectChanges();
      expect(node()).toEqual(kind === 'field' ? 'Marco' : { name: 'Marco' });
      expect(node.$api.touched()).toBe(true);
      node.$api.disable();
      fixture.detectChanges();
      expect(control.disabled()).toBe(true);
      node.$api.enable();
      fixture.detectChanges();
      expect(control.disabled()).toBe(syncInputs === false);
    });
  });

  it.each((['field', 'form'] as const).flatMap(kind => (['all', 'signal-controls', 'cva'] as const).map(target => ({ kind, target }))))('targets input writes while keeping native and hybrid CVA bindings with %j', ({ kind, target }) => {
    const syncSelection = { inputs: 'all', target } as const;
    @Component({
      template: `
        <config-value-control [formNode]="node" />
        <config-cva-control [formNode]="node" />
        <config-checkbox-control [formNode]="active" />
        <input [formNode]="native">
      `,
      imports: [FormNodeDirective, ValueControl, CvaControl, CheckboxControl],
      providers: [provideFormNodesConfig({ syncInputs: syncSelection })],
    })
    class Host {
      profile = form({ nested: form({ name: field('Mark', [required]) }, [required]) });
      node = kind === 'field' ? this.profile.nested.name : this.profile.nested;
      active = field.strict(true);
      native = field('Native', [required]);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const [valueHost, cvaHost, checkboxHost, nativeHost] = fixture.debugElement.children;
    const value = valueHost!.componentInstance as ValueControl;
    const cva = cvaHost!.componentInstance as CvaControl;
    const checkbox = checkboxHost!.componentInstance as CheckboxControl;
    const native = nativeHost!.nativeElement as HTMLInputElement;
    expect(value.required()).toBe(target !== 'cva');
    expect(value.readOnly()).toBe(target === 'cva');
    expect(cva.readonly()).toBe(target === 'signal-controls');
    expect(cva.value()).toBe('owned');
    expect(cva.rendered).toEqual(host.node());
    expect(checkbox.checked()).toBe(true);
    expect(checkbox.disabled()).toBe(target === 'cva');
    expect(native.value).toBe('Native');
    expect(native.required).toBe(true);
    cva.change(kind === 'field' ? 'Edited' : { name: 'Edited' });
    cva.touch();
    checkbox.checked.set(false);
    fixture.detectChanges();
    expect(host.profile.nested.name()).toBe('Edited');
    expect(host.profile.touched()).toBe(true);
    expect(host.active()).toBe(false);
    expect(value.value()).toEqual(host.node());
    host.node.$api.disable();
    host.active.disable();
    host.native.disable();
    fixture.detectChanges();
    expect(cva.disabled).toBe(true);
    expect(checkbox.disabled()).toBe(true);
    expect(native.disabled).toBe(true);
    host.node.$api.enable();
    if (kind === 'field') host.profile.nested.name.reset('Reset');
    else host.profile.nested.reset({ name: 'Reset' });
    fixture.detectChanges();
    expect(cva.disabled).toBe(false);
    expect(cva.rendered).toEqual(host.node());
    expect(cva.readonly()).toBe(target === 'signal-controls');
    expect(value.resets).toBe(1);
  });

  it('allows a nearer provider to enable inputs and preserves native and CVA disabled behavior', () => {
    @Component({
      selector: 'config-opt-in',
      template: '<config-value-control [formNode]="name" />',
      imports: [FormNodeDirective, ValueControl],
      providers: [provideFormNodesConfig({ syncInputs: 'all' })],
    })
    class OptIn {
      name = field('Mark');
    }

    @Component({
      template: `
        <config-value-control [formNode]="profile.name" />
        <config-opt-in />
        <config-cva-control [formNode]="profile.name" />
        <input [formNode]="profile.name">
      `,
      imports: [FormNodeDirective, ValueControl, CvaControl, OptIn],
      providers: [provideFormNodesConfig({ syncInputs: false })],
    })
    class Host {
      profile = form({ name: field('Mark') });
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const controls = fixture.debugElement.children;
    const outer = controls[0]!.componentInstance as ValueControl;
    const inner = controls[1]!.children[0]!.componentInstance as ValueControl;
    const cva = controls[2]!.componentInstance as CvaControl;
    const native = controls[3]!.nativeElement as HTMLInputElement;
    expect(outer.disabled()).toBe(true);
    expect(inner.disabled()).toBe(false);
    expect(cva.readonly()).toBe(true);
    expect(cva.disabled).toBe(false);
    expect(native.disabled).toBe(false);
    fixture.componentInstance.profile.disable();
    fixture.detectChanges();
    expect(cva.disabled).toBe(true);
    expect(native.disabled).toBe(true);
    fixture.componentInstance.profile.enable();
    fixture.detectChanges();
    expect(cva.disabled).toBe(false);
    expect(native.disabled).toBe(false);
  });
});
