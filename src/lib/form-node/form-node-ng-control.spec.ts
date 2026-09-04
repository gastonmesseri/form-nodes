// @vitest-environment jsdom

import '@angular/compiler';
import { startWith } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { Component, DestroyRef, Injector, computed, forwardRef, inject, signal } from '@angular/core';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { FormControl, NG_VALUE_ACCESSOR, NgControl, PristineChangeEvent, StatusChangeEvent, TouchedChangeEvent, Validators, ValueChangeEvent, type AbstractControl, type ControlEvent, type ControlValueAccessor, type FormControlStatus, type ValidationErrors } from '@angular/forms';

import { form } from '../primitives/form';
import { field } from '../primitives/field';
import { array } from '../primitives/array';
import type { Node } from '../types/node.type';
import { FormNode } from './form-node.directive';
import { required } from '../validation/validators/required';
import { asyncValidator } from '../validation/async-validator';
import { requiredIf } from '../validation/validators/required-if';
import type { AsyncValidatorContext, ValidationResult } from '../validation/validation.type';
import { registerSignalInputForJit } from '../../../tests/helpers/register-signal-input-for-jit';

registerSignalInputForJit(FormNode, 'formNode', '_formNodeInput');
beforeAll(() => TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting()));
afterAll(() => TestBed.resetTestEnvironment());

@Component({
  selector: 'legacy-state-control',
  template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LegacyControl), multi: true }],
})
class LegacyControl implements ControlValueAccessor {
  injector = inject(Injector);

  ngControl!: NgControl;

  initialStatus: string | null = null;

  values: unknown[] = [];

  statuses: string[] = [];

  events: ControlEvent[] = [];

  completed = 0;

  onChange: (value: unknown) => void = () => {};

  onTouched: () => void = () => {};

  writeValue(_value: unknown) {}

  registerOnChange(callback: (value: unknown) => void) { this.onChange = callback; }

  registerOnTouched(callback: () => void) { this.onTouched = callback; }

  hasRequiredValidator(): boolean {
    return this.ngControl.control!.hasValidator(Validators.required);
  }

  ngAfterViewInit() {
    this.ngControl = this.injector.get(NgControl, null, { self: true })!;
    this.initialStatus = this.ngControl.status;
    this.ngControl.valueChanges!.subscribe({
      next: value => this.values.push(value),
      complete: () => this.completed++,
    });
    this.ngControl.statusChanges!.subscribe({
      next: status => this.statuses.push(status),
      complete: () => this.completed++,
    });
    this.ngControl.control!.events.subscribe({
      next: event => this.events.push(event),
      complete: () => this.completed++,
    });
  }
}

@Component({ template: `<legacy-state-control [formNode]="active()" />`, imports: [FormNode, LegacyControl] })
class Host {
  active = signal<Node>(field.strict(''));
}

const bind = (node: Node) => {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.active.set(node);
  fixture.detectChanges();
  const cva = fixture.debugElement.children[0]!.componentInstance as LegacyControl;
  cva.values.length = cva.statuses.length = cva.events.length = 0;
  return { fixture, cva, control: cva.ngControl.control! };
};

describe('FormNode NgControl structural identity', () => {
  it('reports root, group, nested form, array, and literal child keys through the directive', () => {
    const profile = form({
      address: { city: field.strict('Zurich') },
      details: form({ code: field.strict('CH') }),
      contacts: array({ email: field.strict('') }, { initialValue: 1 }),
      'city.name': field.strict(''),
      '': field.strict(''),
    });
    const cases: [Node, string | number | null, string[]][] = [
      [field.strict(''), null, []],
      [profile, null, []],
      [profile.address, 'address', ['address']],
      [profile.address.city, 'city', ['address', 'city']],
      [profile.details, 'details', ['details']],
      [profile.details.code, 'code', ['details', 'code']],
      [profile.contacts, 'contacts', ['contacts']],
      [profile.contacts[0]!, 0, ['contacts', '0']],
      [profile.contacts[0]!.email, 'email', ['contacts', '0', 'email']],
      [profile['city.name'], 'city.name', ['city.name']],
      [profile[''], '', ['']],
    ];
    for (const [node, name, path] of cases) {
      const { fixture, cva, control } = bind(node);
      expect(cva.ngControl.name).toBe(name);
      expect(cva.ngControl.path).toEqual(path);
      // The combined runtime adapter also exposes these on control; AbstractControl does not type them.
      expect(control).toBe(cva.ngControl);
      cva.ngControl.path!.push('consumer mutation');
      expect(cva.ngControl.path).toEqual(path);
      expect(node.$api.path()).toEqual(path);
      fixture.destroy();
    }
  });

  it('reactively follows moves, ancestor detachment, reattachment, and binding replacement', () => {
    const profile = form({ contacts: array({ email: field.strict('') }, { initialValue: 2 }) }, { equal: () => true });
    const retainedValue = profile();
    const item = profile.contacts[1]!;
    const boundItem = bind(item);
    const boundLeaf = bind(item.email);
    const identity = computed(() => [boundItem.cva.ngControl.name, boundItem.cva.ngControl.path]);
    const leafPath = computed(() => boundLeaf.cva.ngControl.path);
    expect(identity()).toEqual([1, ['contacts', '1']]);
    expect(leafPath()).toEqual(['contacts', '1', 'email']);
    profile.contacts.move(1, 0);
    expect(profile()).toBe(retainedValue);
    expect(identity()).toEqual([0, ['contacts', '0']]);
    expect(leafPath()).toEqual(['contacts', '0', 'email']);
    profile.contacts.removeAt(0);
    expect(identity()).toEqual([null, []]);
    expect(leafPath()).toEqual(['email']);
    const destination = form({});
    destination.add('moved', item);
    expect(identity()).toEqual(['moved', ['moved']]);
    expect(leafPath()).toEqual(['moved', 'email']);
    boundItem.fixture.componentInstance.active.set(profile.contacts);
    boundItem.fixture.detectChanges();
    expect(identity()).toEqual(['contacts', ['contacts']]);
    destination.remove('moved');
    expect(identity()).toEqual(['contacts', ['contacts']]);
    expect(leafPath()).toEqual(['email']);
    boundItem.fixture.destroy();
    boundLeaf.fixture.destroy();
  });
});

describe('FormNode NgControl required validator compatibility', () => {
  it('lets a CVA recognize Form Nodes required through Angular Validators.required', () => {
    const profile = form({ name: field.strict('', [required]) });
    const { fixture, cva } = bind(profile.name);

    expect(cva.hasRequiredValidator()).toBe(true);
    expect(profile.name.invalid()).toBe(true);

    profile.name.set('Ada');
    fixture.detectChanges();
    // The required rule still applies when the value satisfies it and there is no error.
    expect(profile.name.errors()).toEqual([]);
    expect(cva.hasRequiredValidator()).toBe(true);

    fixture.componentInstance.active.set(field.strict('Optional name'));
    fixture.detectChanges();
    expect(cva.hasRequiredValidator()).toBe(false);
    fixture.destroy();
  });

  it('lets a CVA observe requiredIf becoming active and inactive through Angular Validators.required', () => {
    const requiresName = signal(false);
    const profile = form({ name: field.strict('', [requiredIf(requiresName)]) });
    const { fixture, cva } = bind(profile.name);

    expect(cva.hasRequiredValidator()).toBe(false);
    expect(profile.valid()).toBe(true);

    requiresName.set(true);
    fixture.detectChanges();
    expect(cva.hasRequiredValidator()).toBe(true);
    expect(profile.invalid()).toBe(true);

    profile.name.set('Ada');
    fixture.detectChanges();
    expect(profile.valid()).toBe(true);
    expect(cva.hasRequiredValidator()).toBe(true);

    requiresName.set(false);
    fixture.detectChanges();
    expect(cva.hasRequiredValidator()).toBe(false);
    expect(profile.valid()).toBe(true);

    requiresName.set(true);
    fixture.detectChanges();
    expect(cva.hasRequiredValidator()).toBe(true);
    expect(profile.valid()).toBe(true);
    fixture.destroy();
  });
});

describe('FormNode NgControl error queries', () => {
  it('lets a CVA query validator errors and original imperative payloads through NgControl and control', () => {
    const profile = form({ name: field.strict('', [required]) });
    const { fixture, cva, control } = bind(profile.name);
    const requiredError = profile.name.getError('required');
    expect(cva.ngControl.getError('required')).toBe(requiredError);
    expect(control.getError('required')).toBe(requiredError);
    expect(cva.ngControl.hasError('required')).toBe(true);
    expect(control.hasError('required')).toBe(true);
    expect(control.getError('missing')).toBeUndefined();
    expect(control.hasError('missing')).toBe(false);
    expect(control.getError('toString')).toBeUndefined();
    expect(control.hasError('constructor')).toBe(false);

    const payload = { message: 'Invalid date format' };
    control.setErrors({ invalidDateFormat: payload, falsePayload: false, nullPayload: null, undefinedPayload: undefined });
    expect(cva.ngControl.getError('invalidDateFormat')).toBe(payload);
    expect(cva.ngControl.hasError('invalidDateFormat')).toBe(true);
    expect(control.getError('falsePayload')).toBe(false);
    expect(control.getError('nullPayload')).toBeNull();
    expect(control.getError('undefinedPayload')).toBeUndefined();
    expect(control.hasError('falsePayload')).toBe(false);
    expect(control.hasError('nullPayload')).toBe(false);
    expect(control.hasError('undefinedPayload')).toBe(false);
    control.setErrors(null);
    profile.name.set('Ada');
    expect(control.getError('required')).toBeNull();
    expect(control.hasError('required')).toBe(false);
    expect(control.getError('required', 'child')).toBeNull();
    fixture.destroy();
  });

  it('queries groups, nested forms, and array items using relative string and segment paths', () => {
    const profile = form({
      address: { city: field.strict('', [required]), 'city.name': field.strict('', [required]) },
      details: form({ code: field.strict('', [required]) }),
      contacts: array({ email: field.strict('', [required]) }, { initialValue: [{ email: 'ada@example.com' }, { email: '' }] }),
      api: field.strict('', [required]),
      children: field.strict('', [required]),
      constructor: field.strict('', [required]),
      '': field.strict('', [required]),
    }, [() => ({ kind: 'rootRule' })]);
    const { fixture, cva, control } = bind(profile);
    const rootError = profile.$api.getError('rootRule');
    expect(control.getError('rootRule')).toBe(rootError);
    expect(control.getError('rootRule', '')).toBe(rootError);
    expect(control.getError('rootRule', [])).toBeNull();
    expect(control.getError('required')).toBeUndefined();
    expect(control.hasError('required')).toBe(false);
    expect(cva.ngControl.getError('required', 'address.city')).toBe(profile.address.city.getError('required'));
    expect(control.hasError('required', ['address', 'city'])).toBe(true);
    expect(control.hasError('required', ['address', 'city.name'])).toBe(true);
    expect(control.getError('required', ['details', 'code'])).toBe(profile.details.code.getError('required'));
    expect(control.hasError('required', ['contacts', 0, 'email'])).toBe(false);
    expect(control.getError('required', 'contacts.1.email')).toBe(profile.contacts[1]!.email.getError('required'));
    expect(control.hasError('required', ['contacts', -1, 'email'])).toBe(true);
    for (const key of ['api', 'children', 'constructor', '']) {
      expect(control.hasError('required', [key])).toBe(true);
    }
    for (const path of ['missing', 'missing.deeper', 'address.city.child', 'contacts.99.email', 'contacts.length', 'contacts.constructor', 'contacts.01.email']) {
      expect(control.getError('required', path)).toBeNull();
      expect(control.hasError('required', path)).toBe(false);
    }
    expect(control.getError('required', ['contacts', -3, 'email'])).toBeNull();
    expect(control.hasError('required', ['toString'])).toBe(false);
    fixture.destroy();
  });

  it('tracks dynamic children and binding replacement even when exposed aggregate values compare equal', () => {
    const profile = form({ details: {} }, { equal: () => true });
    const retainedValue = profile();
    const { fixture, control } = bind(profile);
    const missing = computed(() => control.hasError('required', 'details.extra'));
    expect(missing()).toBe(false);
    const extra = field.strict('', [required]);
    profile.details.add('extra', extra);
    expect(profile()).toBe(retainedValue);
    expect(missing()).toBe(true);
    extra.set('Ada');
    expect(missing()).toBe(false);
    extra.set('');
    expect(missing()).toBe(true);
    profile.details.remove('extra');
    expect(missing()).toBe(false);
    profile.details.add('extra', field.strict('', [required]));
    expect(missing()).toBe(true);
    fixture.componentInstance.active.set(form({ details: { extra: field.strict('Optional') } }));
    fixture.detectChanges();
    expect(missing()).toBe(false);
    fixture.destroy();
  });

  it('follows current array positions and returns a descendant control error without adopting it', () => {
    const profile = form({ contacts: array({ email: field.strict('') }, { initialValue: 2 }) }, { equal: () => true });
    const retainedValue = profile();
    const parent = bind(profile);
    const child = bind(profile.contacts[1]!.email);
    const payload = { message: 'Malformed input' };
    const firstHasError = computed(() => parent.control.hasError('parse', ['contacts', 0, 'email']));
    const secondHasError = computed(() => parent.control.hasError('parse', ['contacts', 1, 'email']));
    child.control.setErrors({ parse: payload });
    expect(parent.control.invalid).toBe(true);
    expect(parent.control.getError('parse')).toBeNull();
    expect(parent.cva.ngControl.getError('parse', 'contacts.1.email')).toBe(payload);
    expect(firstHasError()).toBe(false);
    expect(secondHasError()).toBe(true);
    profile.contacts.swap(0, 1);
    expect(profile()).toBe(retainedValue);
    expect(firstHasError()).toBe(true);
    expect(secondHasError()).toBe(false);
    profile.contacts.removeAt(0);
    expect(firstHasError()).toBe(false);
    expect(parent.control.valid).toBe(true);
    child.fixture.destroy();
    parent.fixture.destroy();
  });
});

describe('FormNode NgControl subscriptions', () => {
  it.each(['field', 'nested form'] as const)('merges imperative errors with validators and propagates a %s to its parent', (kind) => {
    const name = field.strict('', [required]);
    const node: Node = kind === 'field' ? name : form({ name }, [() => ({ kind: 'formRule' })]);
    const root = form({ nested: form({ edited: node }) });
    const { fixture, cva, control } = bind(node);
    const payload = { message: 'Use DD/MM/YYYY', actual: '32/13/2026' };
    const source = { invalidDateFormat: payload };
    control.setErrors(source);
    expect(control.errors?.['invalidDateFormat']).toBe(payload);
    expect(node.$api.getError('invalidDateFormat')).toMatchObject({
      kind: 'invalidDateFormat', context: payload, message: 'Use DD/MM/YYYY', targetNode: node,
    });
    expect(root.invalid()).toBe(true);
    expect(root.allErrors().some(error => error.kind === 'invalidDateFormat')).toBe(true);
    expect(source).toEqual({ invalidDateFormat: payload });
    fixture.detectChanges();
    expect(cva.statuses.at(-1)).toBe('INVALID');

    control.setErrors({ anotherError: true });
    expect(control.errors?.['invalidDateFormat']).toBeUndefined();
    expect(control.errors?.['anotherError']).toBe(true);
    expect(root.allErrors().some(error => error.kind === 'invalidDateFormat')).toBe(false);
    control.setErrors(null);
    expect(node.$api.getError('anotherError')).toBeUndefined();
    expect(name.getError('required')).toBeDefined();
    expect(control.invalid).toBe(true);
    if (kind === 'nested form') expect(control.errors?.['formRule']).toBeDefined();
    fixture.destroy();
  });

  it.each(['field', 'nested form'] as const)('keeps async validation independent of imperative errors on a %s', async (kind) => {
    const requests: { abortSignal: AbortSignal; resolve: (result: ValidationResult) => void }[] = [];
    const validate = vi.fn(({ abortSignal }: AsyncValidatorContext<string>) => {
      return new Promise<ValidationResult>(resolve => requests.push({ abortSignal, resolve }));
    });
    const name = field.strict('Ada', [asyncValidator(validate)], { adoptBindingInjector: false, inheritInjector: false });
    const node = kind === 'field' ? name : form({ nested: form({ name }) });
    const { fixture, cva, control } = bind(node);
    await vi.waitFor(() => expect(validate).toHaveBeenCalledOnce());
    control.setErrors({ invalidDateFormat: true });
    expect(control.pending).toBe(true);
    expect(control.status).toBe('INVALID');
    expect(requests[0]!.abortSignal.aborted).toBe(false);
    requests[0]!.resolve({ kind: 'remoteError' });
    await vi.waitFor(() => expect(control.pending).toBe(false));
    expect(validate).toHaveBeenCalledOnce();
    fixture.detectChanges();
    expect(cva.statuses.at(-1)).toBe('INVALID');
    expect(node.$api.allErrors().map(error => error.kind)).toContain('remoteError');
    control.setErrors(null);
    expect(control.invalid).toBe(true);
    expect(node.$api.allErrors().map(error => error.kind)).toEqual(['remoteError']);
    fixture.destroy();
  });

  it('preserves parsing errors across writes and clears them on reset or explicit correction', () => {
    const name = field.strict('initial');
    const root = form({ name });
    const { fixture, cva, control } = bind(name);
    control.setErrors(null);
    expect(root.valid()).toBe(true);
    control.setErrors({ invalidDateFormat: { message: 'Invalid date' } });
    fixture.detectChanges();
    expect(root.invalid()).toBe(true);
    name.set('different');
    fixture.detectChanges();
    expect(control.invalid).toBe(true);
    control.setErrors(null);
    expect(root.valid()).toBe(true);
    fixture.detectChanges();
    expect(cva.statuses.at(-1)).toBe('VALID');
    control.setErrors({ invalidDateFormat: 'unparseable' });
    expect(control.errors?.['invalidDateFormat']).toBe('unparseable');
    root.reset();
    expect(name.errors()).toEqual([]);
    expect(control.errors).toBeNull();
    expect(root.valid()).toBe(true);
    fixture.detectChanges();
    control.setErrors({ invalidDateFormat: true });
    fixture.destroy();
    expect(root.valid()).toBe(true);
    control.setErrors({ staleCallback: true });
    expect(name.errors()).toEqual([]);
  });

  it('retains validator ownership when a CVA spreads the exposed errors into setErrors', () => {
    const name = field.strict('', [required]);
    const { fixture, cva, control } = bind(name);
    const requiredError = control.errors?.['required'];
    const dateError = { message: 'Invalid date' };
    control.setErrors({ ...control.errors, invalidDateFormat: dateError });
    expect(control.errors?.['required']).toBe(requiredError);
    expect(name.errors().filter(error => error.kind === 'required')).toHaveLength(1);
    fixture.detectChanges();
    const count = cva.events.length;
    control.setErrors({ ...control.errors });
    fixture.detectChanges();
    expect(cva.events).toHaveLength(count);
    name.set('valid required value');
    expect(control.errors).toEqual({ invalidDateFormat: dateError });
    control.setErrors({});
    expect(name.valid()).toBe(true);
    fixture.destroy();
  });

  it('blocks submission until the control clears its parsing errors', async () => {
    const action = vi.fn();
    const profile = form({ nested: form({ date: field.strict('2026-09-07') }) }, { submission: { action } });
    const { fixture, control } = bind(profile.nested.date);
    control.setErrors({ invalidDateFormat: true });
    expect(await profile.submit()).toBe(false);
    expect(action).not.toHaveBeenCalled();
    expect(profile.nested.date.touched()).toBe(true);
    control.setErrors(null);
    expect(await profile.submit()).toBe(true);
    expect(action).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('can report errors silently from a status subscriber without creating a feedback loop', () => {
    const name = field.strict('Ada');
    const { fixture, cva, control } = bind(name);
    const report = vi.fn(() => control.setErrors({ ...control.errors, reported: true }, { emitEvent: false }));
    control.statusChanges.subscribe(report);
    control.setErrors({ parse: true });
    fixture.detectChanges();
    expect(report).toHaveBeenCalledOnce();
    expect(cva.statuses).toEqual(['INVALID']);
    expect(control.errors).toEqual({ parse: true, reported: true });
    fixture.detectChanges();
    expect(report).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('suppresses only this adapter status notifications for emitEvent false', () => {
    const name = field.strict('Ada');
    const root = form({ name });
    const { fixture, cva, control } = bind(name);
    control.setErrors({ parse: true }, { emitEvent: false });
    expect(control.invalid).toBe(true);
    expect(root.invalid()).toBe(true);
    fixture.detectChanges();
    expect(cva.statuses).toEqual([]);
    expect(cva.events).toEqual([]);
    control.setErrors(null, { emitEvent: false });
    fixture.detectChanges();
    expect(root.valid()).toBe(true);
    expect(cva.statuses).toEqual([]);
    control.setErrors({ parse: true });
    fixture.detectChanges();
    expect(cva.statuses).toEqual(['INVALID']);
    control.setErrors(null, { emitEvent: false });
    name.disable();
    fixture.detectChanges();
    expect(cva.statuses).toEqual(['INVALID', 'DISABLED']);
    fixture.destroy();
  });

  it('suppresses control errors with non-interactive state and restores them when interactive again', () => {
    const hidden = signal(false);
    const readonly = signal(false);
    const name = field.strict('Ada', { hidden, readonly });
    const { fixture, control } = bind(name);
    control.setErrors({ parse: true });
    for (const state of [hidden, readonly]) {
      state.set(true);
      expect(control.errors).toBeNull();
      state.set(false);
      expect(control.errors).toEqual({ parse: true });
    }
    name.disable();
    expect(control.errors).toBeNull();
    name.enable();
    expect(control.errors).toEqual({ parse: true });
    fixture.destroy();
  });

  it('releases old errors on rebinding and attaches subsequent errors to the replacement', () => {
    const first = field.strict('first');
    const second = field.strict('second');
    const third = field.strict('third');
    const { fixture, control } = bind(first);
    control.setErrors({ old: true });
    fixture.componentInstance.active.set(second);
    fixture.detectChanges();
    expect(first.valid()).toBe(true);
    expect(second.valid()).toBe(true);
    control.setErrors({ second: true });
    fixture.componentInstance.active.set(third);
    fixture.detectChanges();
    control.setErrors({ third: true });
    expect(second.valid()).toBe(true);
    expect(third.invalid()).toBe(true);
    fixture.destroy();
    expect(third.valid()).toBe(true);
  });

  it('keeps each binding error source independent when two CVAs edit the same node', () => {
    const name = field.strict('');
    const first = bind(name);
    const second = bind(name);
    first.control.setErrors({ parse: { message: 'First input' } });
    second.control.setErrors({ parse: { message: 'Second input' } });
    expect(name.errors()).toHaveLength(2);
    const firstBinding = first.fixture.debugElement.children[0]!.injector.get(FormNode);
    const secondBinding = second.fixture.debugElement.children[0]!.injector.get(FormNode);
    expect(firstBinding.errors()).toMatchObject([{ message: 'First input' }]);
    expect(secondBinding.errors()).toMatchObject([{ message: 'Second input' }]);
    first.control.setErrors(null);
    expect(name.invalid()).toBe(true);
    expect(secondBinding.errors()).toMatchObject([{ message: 'Second input' }]);
    first.fixture.destroy();
    expect(name.invalid()).toBe(true);
    second.fixture.destroy();
    expect(name.valid()).toBe(true);
  });

  it.each([false, true])('supports content-init mirroring with startWith (internal error validator: %s)', (hasErrorValidator) => {
    @Component({
      selector: 'content-init-state-control',
      template: '',
      providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ContentInitControl), multi: true }],
      host: { 'data-error-validator': String(hasErrorValidator) },
    })
    class ContentInitControl implements ControlValueAccessor {
      injector = inject(Injector);

      takeUntilDestroyed = takeUntilDestroyed<FormControlStatus>(inject(DestroyRef));

      injectedFormControl: AbstractControl | null | undefined;

      internalFormControl = new FormControl('', hasErrorValidator ? () => this.injectedFormControl?.errors ?? null : null);

      disabledInput = signal(false);

      readonly = signal(false);

      snapshots: { status: string; errors: ValidationErrors | null }[] = [];

      writeValue(_value: unknown) {}

      registerOnChange(_callback: (value: unknown) => void) {}

      registerOnTouched(_callback: () => void) {}

      ngAfterContentInit() {
        const ngControl = this.injector.get(NgControl, null);
        this.injectedFormControl = ngControl?.control;
        this.injectedFormControl?.statusChanges
          .pipe(this.takeUntilDestroyed, startWith(this.injectedFormControl.status))
          .subscribe((status) => {
            this.internalFormControl.setErrors(this.injectedFormControl?.errors || null);
            this.snapshots.push({ status, errors: this.internalFormControl.errors });
            const shouldBeDisabled = status === 'DISABLED' || !!this.disabledInput() || !!this.readonly();
            shouldBeDisabled ? this.internalFormControl.disable() : this.internalFormControl.enable();
          });
      }
    }
    const message = signal('First error');
    @Component({
      selector: 'content-init-state-host',
      template: `<content-init-state-control [formNode]="profile.name" />`,
      imports: [FormNode, ContentInitControl],
      host: { 'data-error-validator': String(hasErrorValidator) },
    })
    class ContentInitHost {
      profile = form({ name: field.strict('', [() => ({ kind: 'something', message: message() })]) });
    }
    const fixture = TestBed.createComponent(ContentInitHost);
    fixture.detectChanges();
    const cva = fixture.debugElement.children[0]!.componentInstance as ContentInitControl;
    const name = fixture.componentInstance.profile.name;
    // startWith synchronously reads the adapter in ngAfterContentInit, before later notifications.
    expect(cva.snapshots[0]).toMatchObject({ status: 'INVALID', errors: { something: { message: 'First error' } } });
    expect(cva.injectedFormControl!.errors?.['something']).toMatchObject({ kind: 'something', targetNode: name });
    // Angular enable() runs validators again, replacing errors previously assigned by setErrors().
    expect(cva.internalFormControl.errors).toEqual(hasErrorValidator ? cva.injectedFormControl!.errors : null);

    message.set('Updated error');
    fixture.detectChanges();
    expect(cva.snapshots.at(-1)).toMatchObject({ status: 'INVALID', errors: { something: { message: 'Updated error' } } });
    expect(cva.internalFormControl.errors).toEqual(hasErrorValidator ? cva.injectedFormControl!.errors : null);
    for (const flag of ['readonly', 'disabledInput'] as const) {
      const countBeforeInput = cva.snapshots.length;
      cva[flag].set(true);
      fixture.detectChanges();
      // Reading a component input inside an RxJS callback does not observe that input.
      expect(cva.snapshots).toHaveLength(countBeforeInput);
      expect(cva.internalFormControl.enabled).toBe(true);
      message.set(`Error with ${flag}`);
      fixture.detectChanges();
      expect(cva.internalFormControl.disabled).toBe(true);
      cva[flag].set(false);
      message.set(`Error without ${flag}`);
      fixture.detectChanges();
      expect(cva.internalFormControl.enabled).toBe(true);
    }
    name.disable();
    fixture.detectChanges();
    expect(cva.internalFormControl.disabled).toBe(true);
    expect(cva.internalFormControl.errors).toBeNull();
    name.enable();
    fixture.detectChanges();
    expect(cva.internalFormControl.enabled).toBe(true);
    expect(cva.internalFormControl.errors).toEqual(hasErrorValidator ? cva.injectedFormControl!.errors : null);
    const count = cva.snapshots.length;
    fixture.destroy();
    message.set('After destruction');
    TestBed.tick();
    expect(cva.snapshots).toHaveLength(count);
  });

  it.each(['field', 'nested form'] as const)('observes value, validation, interaction, disabled state and reset for a %s', (kind) => {
    const name = field.strict('', [required]);
    const node = kind === 'field' ? name : form({ profile: form({ name }) });
    const { fixture, cva, control } = bind(node);
    expect(cva.initialStatus).toBe('INVALID');
    expect(cva.ngControl.control).toBe(control);
    expect(control.invalid).toBe(true);
    expect(control.touched).toBe(false);

    name.setControlValue('Ada');
    name.markAsTouched();
    expect(control.valid).toBe(true);
    expect(control.dirty).toBe(true);
    expect(control.touched).toBe(true);
    expect(cva.values).toEqual([]);
    fixture.detectChanges();
    const expectedValue = kind === 'field' ? 'Ada' : { profile: { name: 'Ada' } };
    expect(cva.values).toEqual([expectedValue]);
    expect(cva.statuses).toEqual(['VALID']);
    expect(cva.events).toEqual([
      new ValueChangeEvent(expectedValue, control),
      new StatusChangeEvent('VALID', control),
      new TouchedChangeEvent(true, control),
      new PristineChangeEvent(false, control),
    ]);

    node.$api.disable();
    fixture.detectChanges();
    expect(control.disabled).toBe(true);
    expect(cva.statuses.at(-1)).toBe('DISABLED');
    node.$api.enable();
    fixture.detectChanges();
    expect(control.enabled).toBe(true);
    expect(cva.statuses.at(-1)).toBe('VALID');

    name.reset('');
    fixture.detectChanges();
    expect(control.invalid).toBe(true);
    expect(control.pristine).toBe(true);
    expect(control.untouched).toBe(true);
    expect(cva.statuses.at(-1)).toBe('INVALID');
    expect(cva.events.slice(-2)).toEqual([
      new TouchedChangeEvent(false, control),
      new PristineChangeEvent(true, control),
    ]);
    fixture.destroy();
    expect(cva.completed).toBe(3);
  });

  it('notifies error-detail changes while invalid and isolates subscriber dependencies', () => {
    const message = signal('First error');
    const unrelated = signal(0);
    const name = field.strict('', [() => ({ kind: 'custom', message: message() })]);
    const { fixture, cva, control } = bind(name);
    const errors = vi.fn(() => {
      unrelated();
      return control.errors;
    });
    cva.ngControl.statusChanges!.subscribe(errors);
    cva.ngControl.valueChanges!.subscribe(() => unrelated());
    control.events.subscribe(() => unrelated());

    message.set('Updated error');
    fixture.detectChanges();
    expect(errors).toHaveBeenCalledTimes(1);
    expect(errors.mock.results[0]!.value).toMatchObject({ custom: { message: 'Updated error' } });
    expect(cva.statuses).toEqual(['INVALID']);
    name.set('Updated value');
    fixture.detectChanges();
    const count = cva.events.length;
    const statusCount = errors.mock.calls.length;
    unrelated.set(1);
    fixture.detectChanges();
    expect(cva.events).toHaveLength(count);
    expect(errors).toHaveBeenCalledTimes(statusCount);
    fixture.destroy();
  });

  it('notifies pending changes even when a form remains invalid with the same own error', async () => {
    let resolve!: (result: ValidationResult) => void;
    const name = field.strict('Ada', [asyncValidator(() => {
      return new Promise<ValidationResult>((complete) => { resolve = complete; });
    })], { adoptBindingInjector: false, inheritInjector: false });
    const node = form({ name }, [() => ({ kind: 'form-error' })]);
    const { fixture, cva, control } = bind(node);
    expect(control.invalid).toBe(true);
    expect(control.pending).toBe(true);
    await vi.waitFor(() => expect(resolve).toBeTypeOf('function'));
    const errors = node.errors();
    resolve(null);
    await vi.waitFor(() => expect(control.pending).toBe(false));
    fixture.detectChanges();
    expect(node.errors()).toBe(errors);
    expect(cva.statuses).toEqual(['INVALID']);
    expect(cva.events).toEqual([new StatusChangeEvent('INVALID', control)]);
    fixture.destroy();
  });

  it('keeps one control and its subscriptions across rebinding, then completes on destruction', () => {
    const first = field.strict('Same');
    const second = field.strict('Same');
    const { fixture, cva, control } = bind(first);
    fixture.componentInstance.active.set(second);
    fixture.detectChanges();
    expect(cva.ngControl.control).toBe(control);
    expect(cva.values).toEqual(['Same']);
    expect(cva.statuses).toEqual(['VALID']);
    expect(cva.events).toHaveLength(4);
    first.set('Detached');
    first.disable();
    fixture.detectChanges();
    expect(cva.events).toHaveLength(4);
    cva.onChange('Replacement');
    cva.onTouched();
    fixture.detectChanges();
    expect(second()).toBe('Replacement');
    expect(control.touched).toBe(true);
    expect(cva.values).toEqual(['Same', 'Replacement']);
    const count = cva.events.length;
    fixture.destroy();
    second.set('After destruction');
    TestBed.tick();
    expect(cva.completed).toBe(3);
    expect(cva.events).toHaveLength(count);
    const complete = vi.fn();
    control.events.subscribe({ complete });
    expect(complete).toHaveBeenCalledOnce();
  });

  it('observes buffered CVA input and equality-suppressed writes without replaying subscriptions', () => {
    const name = field.strict('Ada', { debounce: 'blur', equal: (a, b) => a.toLowerCase() === b.toLowerCase() });
    const { fixture, cva, control } = bind(name);
    expect(name()).toBe('Ada');
    name.set('ADA');
    expect(name()).toBe('Ada');
    expect(control.value).toBe('ADA');
    fixture.detectChanges();
    cva.onChange('Grace');
    expect(control.value).toBe('Grace');
    expect(name()).toBe('Ada');
    fixture.detectChanges();
    expect(cva.values).toEqual(['ADA', 'Grace']);
    cva.onTouched();
    fixture.detectChanges();
    expect(name()).toBe('Grace');
    expect(cva.values).toEqual(['ADA', 'Grace']);
    const late = vi.fn();
    control.valueChanges.subscribe(late);
    fixture.detectChanges();
    expect(late).not.toHaveBeenCalled();
    name.set('First');
    name.set('Last');
    fixture.detectChanges();
    expect(late).toHaveBeenCalledExactlyOnceWith('Last');
    fixture.destroy();
  });

  it.each(['field', 'nested form'] as const)('observes async pending, cancellation and completion for a %s', async (kind) => {
    const requests: { signal: AbortSignal; resolve: (result: ValidationResult) => void }[] = [];
    const validate = vi.fn(({ value, abortSignal }: AsyncValidatorContext<string>) => {
      value();
      return new Promise<ValidationResult>(resolve => requests.push({ signal: abortSignal, resolve }));
    });
    const name = field.strict('Ada', [asyncValidator(validate)], { adoptBindingInjector: false, inheritInjector: false });
    const node = kind === 'field' ? name : form({ profile: form({ name }) });
    const { fixture, cva, control } = bind(node);
    expect(control.pending).toBe(true);
    expect(cva.initialStatus).toBe('PENDING');
    await vi.waitFor(() => expect(validate).toHaveBeenCalledTimes(1));
    name.set('Grace');
    fixture.detectChanges();
    await vi.waitFor(() => expect(validate).toHaveBeenCalledTimes(2));
    expect(requests[0]!.signal.aborted).toBe(true);
    requests[0]!.resolve({ kind: 'stale' });
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();
    expect(control.pending).toBe(true);
    expect(cva.statuses).not.toContain('INVALID');
    requests[1]!.resolve({ kind: 'taken' });
    await vi.waitFor(() => expect(control.pending).toBe(false));
    fixture.detectChanges();
    expect(control.invalid).toBe(true);
    expect(cva.statuses.at(-1)).toBe('INVALID');
    name.set('Available');
    await vi.waitFor(() => expect(validate).toHaveBeenCalledTimes(3));
    fixture.detectChanges();
    expect(control.pending).toBe(true);
    expect(cva.statuses.at(-1)).toBe('PENDING');
    requests[2]!.resolve(null);
    await vi.waitFor(() => expect(control.valid).toBe(true));
    fixture.detectChanges();
    expect(control.pending).toBe(false);
    expect(cva.statuses.at(-1)).toBe('VALID');
    fixture.destroy();
  });
});
