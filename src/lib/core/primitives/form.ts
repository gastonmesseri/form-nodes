import { computed, signal, untracked, type Signal } from '@angular/core';

import { group } from './group';
import { isNotNil } from '../utils/is-nil';
import { readMetadata } from '../metadata/metadata';
import { shallowEqual } from '../utils/shallow-equal';
import { isNode, markAsNode } from '../utils/node-marker';
import { mapObjectValues } from '../utils/map-object-values';
import { computedFunction } from '../utils/computed-function';
import { registerAngularField } from '../interop/angular-field';
import { isAsyncValidator } from '../utils/async-validator-marker';
import { markAsFieldContext } from '../utils/field-context-marker';
import { runSyncValidators } from '../validation/run-sync-validators';
import { createNodeMetadata } from '../metadata/create-node-metadata';
import { REQUIRED_METADATA } from '../validation/validators/required';
import { createAsyncValidation } from '../validation/create-async-validation';
import { registerNodeValidatorMessages } from '../validation/validator-messages';
import { readStateSource, getInitialMutableState } from '../utils/read-state-source';
import { createNodeDefinitionFactory } from '../utils/create-node-definition-factory';
import { isValidatorSource, normalizeValidatorSource } from '../validation/validator-source';
import { createReactiveWatch, type ReactiveWatchTarget } from '../utils/create-reactive-watch';
import type { InternalNode, Node, NodeControlBinding, NodeDefinitions } from '../types/node.type';
import type { ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';
import { firstControlBindingInDom, findFirstControlBindingInDom } from '../utils/node-control-binding';
import { createControlValueBuffer, type ControlValueBuffer } from '../utils/create-control-value-buffer';
import { notifyExternalValidationReset, readExternalValidationErrors } from '../validation/external-validation-errors';
import type { Form, FormApi, FormChildren, FormOptions, FormPatch, FormSet, FormValue, NormalizedNodes } from './form.type';
import { createDisabledReason, getInitialDisabledState, readConfiguredDisabledState, type DisabledState } from '../utils/disabled-reasons';

export type { Form, FormApi, FormChildren, FormOptions, FormPatch, FormRoot, FormSet, FormSubmissionOptions, FormValue, NodeWithParent, NormalizedNode, NormalizedNodes } from './form.type';

type FormDefinitions<TDefinitions extends NodeDefinitions> = {
  [TKey in keyof TDefinitions]: TKey extends '$api' | '$field'
    ? never
    : TDefinitions[TKey] extends NodeDefinitions ? FormDefinitions<TDefinitions[TKey]> : TDefinitions[TKey];
};

export function form<TDefinitions extends NodeDefinitions>(
  definitions: TDefinitions & FormDefinitions<TDefinitions>,
  options?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, Form<NormalizedNodes<TDefinitions>>>,
): Form<NormalizedNodes<TDefinitions>>;
export function form<TDefinitions extends NodeDefinitions>(
  definitions: TDefinitions & FormDefinitions<TDefinitions>,
  validators?: ValidatorSource<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>>,
  options?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, Form<NormalizedNodes<TDefinitions>>>,
): Form<NormalizedNodes<TDefinitions>>;
export function form<TDefinitions extends NodeDefinitions>(
  definitions: TDefinitions & FormDefinitions<TDefinitions>,
  validatorsOrOptions?: ValidatorSource<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>> | FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, Form<NormalizedNodes<TDefinitions>>>,
  separateOptions?: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, Form<NormalizedNodes<TDefinitions>>>,
): Form<NormalizedNodes<TDefinitions>> {
  return _createObjectNode<TDefinitions>(definitions, validatorsOrOptions, separateOptions, 'form') as Form<NormalizedNodes<TDefinitions>>;
}

export function _createObjectNode<TDefinitions extends NodeDefinitions>(
  definitions: TDefinitions,
  validatorsOrOptions: ValidatorSource<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>> | FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, Form<NormalizedNodes<TDefinitions>>> | undefined,
  separateOptions: FormOptions<NoInfer<FormValue<NormalizedNodes<TDefinitions>>>, Form<NormalizedNodes<TDefinitions>>> | undefined,
  nodeType: 'form' | 'group',
): Node {
  type TNodes = NormalizedNodes<TDefinitions>;
  type TValue = FormValue<TNodes>;
  const resolvedOptions = isValidatorSource<TValue>(validatorsOrOptions) || validatorsOrOptions === undefined
    ? separateOptions
    : validatorsOrOptions;
  const validatorSource = isValidatorSource<TValue>(validatorsOrOptions)
    ? validatorsOrOptions
    : resolvedOptions?.validators ?? [];
  const validators = normalizeValidatorSource(validatorSource);
  const cloneOptions = resolvedOptions === undefined ? undefined : { ...resolvedOptions };
  const createDefinitions = createNodeDefinitionFactory(definitions);
  const controls = mapObjectValues(definitions, definition => isNode(definition) ? definition : group(definition)) as TNodes;
  const controlKeys = () => Object.keys(controls) as (keyof TNodes)[];
  const formSelfTouched = signal(false);
  const formSelfDirty = signal(false);
  const formControlBindings = new Set<NodeControlBinding>();
  const formSelfSubmitting = signal(false);
  const formSelfDisabled = signal<DisabledState>(getInitialDisabledState(resolvedOptions?.disabled));
  const formParent = signal<Node | null>(null);
  const formKeyInParent = signal<string | number | null>(null);
  const formControlDebounce = computed(() =>
    resolvedOptions?.debounce
    ?? (formParent() as InternalNode | null)?.$api._controlDebounce(),
  );
  const formPath = computed((): readonly string[] => {
    const parent = formParent();
    const key = formKeyInParent();
    return parent && key !== null ? [...parent.$api.path(), String(key)] : [];
  });
  // eslint-disable-next-line prefer-const -- Assigned after self-referencing computed state has been declared.
  let formNode!: Form<TNodes>;
  const formOwnDisabledReason = computed(() => createDisabledReason(formSelfDisabled(), formNode), { equal: shallowEqual });
  const formConfiguredDisabledReason = computed(
    () => createDisabledReason(readConfiguredDisabledState(resolvedOptions?.disabled), formNode),
    { equal: shallowEqual },
  );
  const formDisabledReasons = computed(() => [
    ...(formParent()?.$api.disabledReasons() ?? []),
    ...[formOwnDisabledReason(), formConfiguredDisabledReason()].filter(isNotNil),
  ], { equal: shallowEqual });
  const formDisabled = computed(() => formDisabledReasons().length > 0);
  const formSelfReadonly = signal(getInitialMutableState(resolvedOptions?.readonly));
  const formReadonly = computed(() =>
    formSelfReadonly() || readStateSource(resolvedOptions?.readonly) || formParent()?.$api.readonly() === true,
  );
  const formSelfHidden = signal(getInitialMutableState(resolvedOptions?.hidden));
  const formHidden = computed(() =>
    formSelfHidden() || readStateSource(resolvedOptions?.hidden) || formParent()?.$api.hidden() === true,
  );
  const formNonInteractive = computed(() => formHidden() || formDisabled() || formReadonly());
  const formValue = computed(() => {
    const value = {} as FormValue<TNodes>;
    controlKeys().forEach((key) => { value[key] = controls[key]!(); });
    return value;
  });
  const formContext = markAsFieldContext({ value: formValue });
  const formValidators = signal<Validators<FormValue<TNodes>>>(validators);
  const emptySyncMetadata = new Map();
  const rootForm = computed(() => formParent()?.$api.form() ?? formNode) as Signal<Form<TNodes>>;
  const formSyncValidation = computed(() => formNonInteractive()
    ? { errors: [], metadata: emptySyncMetadata }
    : runSyncValidators(formContext, formValidators(), formNode));
  const formSyncErrors = computed(() => formSyncValidation().errors);
  const formMetadata = createNodeMetadata(formValidators, computed(() => formSyncValidation().metadata));
  const asyncValidation = createAsyncValidation(
    formContext,
    formValidators,
    formSyncErrors,
    () => formNode,
    () => !formNonInteractive(),
  );
  const formControlErrors = computed(() => formNonInteractive()
    ? []
    : readExternalValidationErrors(formNode));
  const formErrors = computed(() => [...formSyncErrors(), ...asyncValidation.errors(), ...formControlErrors()]);
  const formAllErrors = computed(
    () => [
      ...formErrors(),
      ...controlKeys().flatMap(key => controls[key]!.$api.allErrors()),
    ],
    { equal: shallowEqual },
  );
  const getError = computedFunction(
    (kind: string) => formErrors().find(error => error.kind === kind),
    { equal: shallowEqual, max: 20 },
  ) as FormApi<TNodes>['getError'];
  const formPending = computed(() =>
    !formNonInteractive() && (
      asyncValidation.pending() || controlKeys().some(key => controls[key]!.$api.pending())
    ),
  );
  const formSubmitting = computed(() =>
    formSelfSubmitting() || formParent()?.$api.submitting() === true,
  );
  const formValidationStatus = computed<ValidationStatus>(() => {
    if (formNonInteractive()) return 'valid';
    if (formErrors().length > 0 || controlKeys().some(key => controls[key]!.$api.invalid())) return 'invalid';
    if (formPending()) return 'unknown';
    return 'valid';
  });
  let asyncValidationWatchTarget: ReactiveWatchTarget | null = null;
  const ensureAsyncValidationWatch = () => {
    if (asyncValidationWatchTarget || !formValidators().some(isAsyncValidator)) return;
    asyncValidationWatchTarget = { run: asyncValidation.validate, cleanup: asyncValidation.cancel, destroy: asyncValidation.destroy };
    createReactiveWatch(asyncValidationWatchTarget, resolvedOptions?.injector);
  };
  const formTouched = computed(() =>
    !formNonInteractive() && (formSelfTouched() || controlKeys().some(key => controls[key]!.$api.touched())),
  );
  const formDirty = computed(() =>
    !formNonInteractive() && (formSelfDirty() || controlKeys().some(key => controls[key]!.$api.dirty())),
  );
  // eslint-disable-next-line prefer-const -- Assigned after computed state that reads the buffer has been declared.
  let formControlValueBuffer!: ControlValueBuffer<FormValue<TNodes>, FormSet<TNodes>>;
  const formDebouncing = computed(() =>
    formControlValueBuffer.debouncing()
    || controlKeys().some(key => controls[key]!.$api.debouncing()),
  );
  const set = (value: FormSet<TNodes>) => {
    formControlValueBuffer?.cancel();
    (Object.keys(value) as (keyof TNodes)[]).forEach((key) => {
      const control = controls[key];
      if (control === undefined) {
        console.warn(`form: unknown key "${String(key)}" ignored on set`);
        return;
      }
      control.$api.set(value[key]);
    });
  };
  const patch = (value: FormPatch<TNodes>) => {
    formControlValueBuffer?.cancel();
    (Object.keys(value) as (keyof TNodes)[]).forEach((key) => {
      const control = controls[key] as Node | undefined;
      if (control === undefined) {
        console.warn(`form: unknown key "${String(key)}" ignored on patch`);
        return;
      }
      control.$api.patch(value[key]);
    });
  };
  const reset = (...args: [] | [value: FormSet<TNodes>]) => {
    formControlValueBuffer?.cancel();
    formSelfTouched.set(false);
    formSelfDirty.set(false);
    notifyExternalValidationReset(formNode);
    if (args.length === 0) {
      controlKeys().forEach(key => controls[key]!.$api.reset());
      formControlBindings.forEach(binding => binding.reset?.());
      return;
    }
    const value = args[0];
    controlKeys().forEach(key => controls[key]!.$api.reset(value[key]));
    formControlBindings.forEach(binding => binding.reset?.());
  };
  const getControlBindingForFocus = () => {
    const own = findFirstControlBindingInDom(formControlBindings);
    if (own) return own;
    return controlKeys()
      .map(key => (controls[key] as InternalNode).$api._getControlBindingForFocus())
      .reduce(firstControlBindingInDom, undefined);
  };
  formControlValueBuffer = createControlValueBuffer(
    formValue,
    formControlDebounce,
    set,
    () => formSelfDirty.set(true),
  );
  const submit = async (): Promise<boolean> => {
    if (untracked(formSubmitting)) return false;
    const submission = resolvedOptions?.submission;
    formNode.$api.markAsTouched();
    if (!submission) return false;
    const shouldRun = submission.ignoreValidators === 'all'
      || (submission.ignoreValidators === 'none' ? untracked(formNode.$api.valid) : !untracked(formNode.$api.invalid));
    if (!shouldRun) {
      untracked(() => submission.onInvalid?.(formNode));
      return false;
    }
    formSelfSubmitting.set(true);
    try {
      await untracked(() => submission.action(formNode, formValue()));
      return true;
    } finally {
      formSelfSubmitting.set(false);
    }
  };
  const api = {
    children: controls as FormChildren<TNodes, Node>,
    form: rootForm,
    parent: formParent.asReadonly(),
    path: formPath,
    keyInParent: formKeyInParent.asReadonly(),
    value: formValue,
    controlValue: formControlValueBuffer.controlValue,
    set,
    update: updater => untracked(() => set(updater(formValue()))),
    patch,
    reset,
    validators: formValidators.asReadonly(),
    setValidators: (next) => {
      formValidators.set(normalizeValidatorSource(next));
      ensureAsyncValidationWatch();
    },
    errors: formErrors,
    allErrors: formAllErrors,
    valid: computed(() => formValidationStatus() === 'valid'),
    invalid: computed(() => formValidationStatus() === 'invalid'),
    getError,
    required: computed(() =>
      readMetadata(formMetadata(), REQUIRED_METADATA)
      || formErrors().some(error => error.kind === 'required')
    ),
    pending: formPending,
    submitting: formSubmitting,
    ...(nodeType === 'form' ? { submit } : {}),
    debouncing: formDebouncing,
    flush: () => {
      formControlValueBuffer.flush();
      controlKeys().forEach(key => controls[key]!.$api.flush());
    },
    focus: (options?: FocusOptions) => getControlBindingForFocus()?.focus(options),
    validationStatus: formValidationStatus,
    touched: formTouched,
    untouched: computed(() => !formTouched()),
    markAsTouched: (options) => {
      if (formNonInteractive()) return;
      formSelfTouched.set(true);
      formControlValueBuffer.flush();
      if (!options?.skipDescendants) controlKeys().forEach(key => controls[key]!.$api.markAsTouched());
    },
    markAsUntouched: () => formSelfTouched.set(false),
    dirty: formDirty,
    pristine: computed(() => !formDirty()),
    markAsDirty: () => formSelfDirty.set(true),
    markAsPristine: () => formSelfDirty.set(false),
    disabled: formDisabled,
    disabledReasons: formDisabledReasons,
    enabled: computed(() => !formDisabled()),
    disable: (message?: string) => formSelfDisabled.set(message ?? true),
    enable: () => formSelfDisabled.set(false),
    readonly: formReadonly,
    writable: computed(() => !formReadonly()),
    markAsReadonly: () => formSelfReadonly.set(true),
    markAsWritable: () => formSelfReadonly.set(false),
    hidden: formHidden,
    visible: computed(() => !formHidden()),
    hide: () => formSelfHidden.set(true),
    show: () => formSelfHidden.set(false),
  } as FormApi<TNodes>;
  const internalApi = {
    ...api,
    _nodeType: nodeType,
    _controlDebounce: formControlDebounce,
    _controlValue: api.controlValue,
    _setControlValue: formControlValueBuffer.set,
    _flushControlValueOnBlur: api.flush,
    _clone: () => _createObjectNode(createDefinitions(), validatorSource, cloneOptions, nodeType),
    _setParent: (parent: Node | null, key?: string) => {
      formParent.set(parent);
      formKeyInParent.set(parent ? key ?? null : null);
    },
    _registerControlBinding: (binding: NodeControlBinding) => {
      formControlBindings.add(binding);
      return () => { formControlBindings.delete(binding); };
    },
    _getControlBindingForFocus: getControlBindingForFocus,
  };
  formNode = Object.defineProperties(
    () => formValue(),
    Object.getOwnPropertyDescriptors({ ...api, api: internalApi, ...controls, $api: internalApi }),
  ) as Form<TNodes>;
  controlKeys().forEach(key => (controls[key] as InternalNode).$api._setParent(formNode, String(key)));
  markAsNode(formNode);
  registerAngularField(formNode, resolvedOptions?.injector);
  registerNodeValidatorMessages(formNode, resolvedOptions?.validatorMessages, resolvedOptions?.injector);
  ensureAsyncValidationWatch();
  return formNode;
}
