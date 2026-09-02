import type { Injector, Signal } from '@angular/core';

import type { Field } from './field.type';
import type { ArrayNode } from './array.type';
import type { Group } from './group.type';
import type { OpaqueAngularField } from '../interop/angular-field.type';
import type { ValidatorMessages } from '../validation/validator-messages';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { CustomValidationError, ValidationError, ValidationErrorMap, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';
import type { DisabledReason, Node, NodeDefinition, NodeDefinitions, NodeKeyInParent, NodePatch, NodeSet, Nodes, NodeValue, RootNode } from '../types/node.type';

export type FormOptions<TValue = any, TForm extends Node = Form<any>> = {
  /**
   * One validator or an array of validators that validate the complete form value.
   *
   * Start with a named validator when the rule is reused:
   *
   * @example
   * ```ts
   * form({
   *   email: field(''),
   *   marketingConsent: field(false),
   * }, {
   *   validators: [profilePolicy],
   * });
   * ```
   *
   * A small form-specific rule can be declared inline:
   *
   * @example
   * ```ts
   * form({
   *   acceptTerms: field(false),
   * }, {
   *   validators: ({ value }) => {
   *     return value().acceptTerms
   *       ? null
   *       : { kind: 'termsRequired', message: 'Accept the terms to continue.' };
   *   },
   * });
   * ```
   *
   * Form validators are also useful for cross-field rules:
   *
   * @example
   * ```ts
   * form({
   *   password: field(''),
   *   confirmation: field(''),
   * }, {
   *   validators: [
   *     ({ value }) => {
   *       return value().password === value().confirmation
   *         ? null
   *         : { kind: 'passwordMismatch', message: 'Passwords must match.' };
   *     },
   *   ],
   * });
   * ```
   *
   * Asynchronous rules must be wrapped with `asyncValidator()`:
   *
   * @example
   * ```ts
   * form({
   *   username: field(''),
   * }, {
   *   validators: asyncValidator(async ({ value }) => {
   *     const available = await isAccountAvailable(value());
   *     return available ? null : { kind: 'accountUnavailable' };
   *   }),
   * });
   * ```
   *
   * Use an array when the form needs multiple validators. Arrays may contain synchronous
   * validators, validators created with `asyncValidator()`, and ignored `null` or `undefined`
   * entries.
   */
  validators?: ValidatorSource<TValue>;
  /** Optional injector that owns the asynchronous validation watcher lifecycle. */
  injector?: Injector;
  /**
   * Whether this node may use the injector of its parent or another ancestor when it has no
   * injector of its own. Defaults to `true`. Set to `false` to create an injector-inheritance
   * boundary while preserving an explicit or currently captured injector on this node.
   */
  inheritInjector?: boolean;
  /**
   * Whether this node may temporarily adopt the injector of a directly bound `[formNode]` host
   * when it has no injector of its own. Defaults to `true`. The binding injector takes precedence
   * over an inherited ancestor injector and is released when the binding is destroyed or rebound.
   */
  adoptBindingInjector?: boolean;
  /**
   * Partial validator message catalog inherited by this form or array and its descendants.
   *
   * ℹ️ This scope overrides provider and global catalogs. A validator's own `message` option has
   * higher priority. Returning `undefined` from the catalog source or a message function continues
   * through the fallback chain.
   *
   * @reactive Tracks signals read by the catalog source and the selected message function while a
   * built-in validator is failing.
   */
  validatorMessages?: ValidatorMessages | (() => ValidatorMessages | undefined);
  /**
   * Default control-value debounce inherited by descendants: milliseconds, `'blur'`, or a
   * cancelable asynchronous function.
   *
   * @example Give descendant controls a 300-millisecond debounce by default.
   * ```ts
   * form({
   *   searchTerm: field(''),
   * }, { debounce: 300 });
   * ```
   *
   * @example Commit descendant control values when their controls lose focus.
   * ```ts
   * form({
   *   displayName: field(''),
   * }, { debounce: 'blur' });
   * ```
   */
  debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);
  /**
   * Initial or reactive visibility of the complete form subtree.
   *
   * @example Create a form that starts hidden.
   * ```ts
   * form({
   *   internalNotes: field(''),
   * }, { hidden: true });
   * ```
   *
   * @example Hide a business-details workflow for personal accounts.
   * ```ts
   * form({
   *   companyName: field(''),
   * }, {
   *   hidden: () => accountType() !== 'business',
   * });
   * ```
   */
  hidden?: boolean | (() => boolean);
  /**
   * Initial or reactive disabled state for the complete subtree. Return a string to record a
   * user-facing reason.
   *
   * @example Create a form that starts disabled.
   * ```ts
   * form({
   *   email: field(''),
   * }, { disabled: 'This workflow is not available yet.' });
   * ```
   *
   * @example Disable a checkout workflow while its order is being submitted.
   * ```ts
   * form({
   *   email: field(''),
   * }, {
   *   disabled: () => submittingOrder() ? 'The order is being submitted.' : false,
   * });
   * ```
   */
  disabled?: boolean | string | (() => boolean | string);
  /**
   * Initial or reactive readonly state for the complete subtree.
   *
   * @example Create a form that starts in readonly mode.
   * ```ts
   * form({
   *   displayName: field(''),
   * }, { readonly: true });
   * ```
   *
   * @example Present an archived record without allowing edits.
   * ```ts
   * form({
   *   displayName: field(''),
   * }, {
   *   readonly: () => recordStatus() === 'archived',
   * });
   * ```
   */
  readonly?: boolean | (() => boolean);
  /** Submission behavior used by `submit()` and by a bound native `<form>`. */
  submission?: FormSubmissionOptions<TValue, TForm>;
};

export type FormSubmissionOptions<TValue, TForm extends Node = Form<any>> = {
  /** Runs when submission is allowed by the current validation state. */
  action: (form: TForm, value: TValue) => void | PromiseLike<void>;
  /** Runs instead of `action` when validation blocks submission. */
  onInvalid?: (form: TForm) => void;
  /** Which validation states may be ignored when deciding whether to run `action`. */
  ignoreValidators?: 'pending' | 'none' | 'all';
};

export type FormValue<TNodes extends Nodes> = {
  [K in keyof TNodes]: NodeValue<TNodes[K]>;
};

export type FormSet<TNodes extends Nodes> = {
  [K in keyof TNodes]: NodeSet<TNodes[K]>;
};

export type FormPatch<TNodes extends Nodes> = {
  [K in keyof TNodes]?: NodePatch<TNodes[K]>;
};

export type NormalizedNode<TNode extends NodeDefinition> =
  TNode extends Node ? TNode
    : TNode extends NodeDefinitions ? Group<NormalizedNodes<TNode>> : Node;

export type NormalizedNodes<TNodes extends NodeDefinitions> = {
  [K in keyof TNodes]: NormalizedNode<TNodes[K]>;
};

export type FormRoot<TNodes extends Nodes, TParent extends Node> = Node extends TParent
  ? Form<TNodes, TParent>
  : RootNode<TParent>;

export type FormApi<TNodes extends Nodes, TParent extends Node = Node> = {
  readonly children: FormChildren<TNodes, TParent>;
  form: Signal<FormRoot<TNodes, TParent>>;
  parent: Signal<TParent | null>;
  path: Signal<readonly string[]>;
  /**
   * Property or array index under which this form is stored, or `null` when it is a root form.
   *
   * @example
   * `myForm.address.keyInParent()` returns `'address'`.
   */
  keyInParent: Signal<NodeKeyInParent<TParent>>;
  value: Signal<{ [K in keyof TNodes]: NodeValue<TNodes[K]> }>;
  /** Complete value represented by a control bound directly to this form. Pending descendant control values are not aggregated. */
  controlValue: Signal<{ [K in keyof TNodes]: NodeValue<TNodes[K]> }>;
  set(value: FormSet<TNodes>): void;
  /** Computes and sets the complete form value from its current value without marking nodes dirty. */
  update(updater: (value: FormValue<TNodes>) => FormSet<TNodes>): void;
  patch(value: FormPatch<TNodes>): void;
  reset(...args: [] | [value: FormSet<TNodes>]): void;
  validators: Signal<Validators<FormValue<TNodes>>>;
  setValidators(validators: ValidatorSource<FormValue<TNodes>>): void;
  /**
   * A signal containing the validation errors of **this form node itself, excluding its descendants**.
   *
   * ℹ️ To collect errors from the complete subtree, use `allErrors()` instead.
   */
  errors: Signal<readonly ValidationError.WithTargetNode<Form<TNodes, TParent>>[]>;
  /**
   * A signal containing the validation errors of **this form node and its descendants**.
   *
   * ℹ️ To read only errors belonging directly to this form node, use `errors()` instead.
   */
  allErrors: Signal<readonly ValidationError.WithTargetNode<Node>[]>;
  valid: Signal<boolean>;
  invalid: Signal<boolean>;
  /**
   * Returns the first validation error belonging directly to this form and matching `kind`.
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationError.WithTargetNode<Form<TNodes, TParent>> & ValidationErrorMap[TKind]) | undefined;
  getError<TKind extends string>(kind: TKind): (ValidationError.WithTargetNode<Form<TNodes, TParent>> & CustomValidationError<TKind>) | undefined;
  required: Signal<boolean>;
  pending: Signal<boolean>;
  /** Whether this form or an ancestor form is currently running its submission action. */
  submitting: Signal<boolean>;
  /**
   * Marks and flushes the subtree, then runs the configured submission action when validation
   * allows it. Resolves to `false` without throwing when no action is configured.
   */
  submit(): Promise<boolean>;
  /** Whether any descendant field currently has a pending control-value debounce. */
  debouncing: Signal<boolean>;
  /** Immediately commits every pending control value in this form's subtree. */
  flush(): void;
  /** Focuses the first bound UI control in this form's subtree, in DOM order. */
  focus(options?: FocusOptions): void;
  validationStatus: Signal<ValidationStatus>;
  touched: Signal<boolean>;
  untouched: Signal<boolean>;
  markAsTouched(options?: {
    /** When true, marks only this form and leaves every descendant untouched. */
    skipDescendants?: boolean;
  }): void;
  markAsUntouched(): void;
  dirty: Signal<boolean>;
  pristine: Signal<boolean>;
  markAsDirty(): void;
  markAsPristine(): void;
  disabled: Signal<boolean>;
  /** Active inherited and local causes of this form's disabled state. */
  disabledReasons: Signal<readonly DisabledReason[]>;
  enabled: Signal<boolean>;
  /** Disables this form subtree, optionally recording a user-facing reason. */
  disable(message?: string): void;
  enable(): void;
  readonly: Signal<boolean>;
  writable: Signal<boolean>;
  markAsReadonly(): void;
  markAsWritable(): void;
  hidden: Signal<boolean>;
  visible: Signal<boolean>;
  hide(): void;
  show(): void;
};

export type NodeWithParent<TNode extends Node, TParent extends Node> =
  TNode extends Field<infer TValue, Node> ? Field<TValue, TParent>
    : TNode extends Form<infer TNodes, Node> ? Form<TNodes, TParent>
      : TNode extends Group<infer TNodes, Node> ? Group<TNodes, TParent>
        : TNode extends ArrayNode<infer TItem, Node> ? ArrayNode<TItem, TParent> : TNode;

export type FormChildren<TNodes extends Nodes, TParent extends Node> = {
  readonly [K in keyof TNodes]: NodeWithParent<TNodes[K], Form<TNodes, TParent>>;
};

type FormApiProperty<TNodes extends Nodes, TParent extends Node> = {
  /**
   * Complete form API and the recommended access path for application code.
   *
   * When a form declares a child named `api`, this property is that child instead. Use `$api`
   * when collision-safe access to the form API is required.
   */
  api: TNodes extends { api: infer TApi extends Node }
    ? NodeWithParent<TApi, Form<TNodes, TParent>>
    : FormApi<TNodes, TParent>;
  /**
   * Collision-safe access to the form API.
   *
   * Prefer `api` for normal application code. Use `$api` when this form declares a child named
   * `api`; the child takes precedence at `form.api`, while `form.$api` always remains the API.
   *
   * Prefer `api` for ordinary application code; `$api` remains a supported, stable escape hatch.
   */
  $api: FormApi<TNodes, TParent>;
  /**
   * Opaque Angular Signal Forms adapter for binding with `[formField]`.
   *
   * This property is supported and is not planned for removal. Use it only as the terminal value
   * passed to Angular's `[formField]` binding.
   *
   * @example
   * ```html
   * <input [formField]="form.user.$field" />
   * ```
   *
   */
  readonly $field: OpaqueAngularField;
};

export type Form<TNodes extends Nodes, TParent extends Node = Node> =
  & { (): { [K in keyof TNodes]: NodeValue<TNodes[K]> } }
  & FormApiProperty<TNodes, TParent>
  & Omit<FormChildren<TNodes, TParent>, 'api'>
  & Omit<FormApi<TNodes, TParent>, keyof TNodes>
  & HiddenFunctionMembers<keyof TNodes | keyof FormApi<TNodes, TParent>>;
