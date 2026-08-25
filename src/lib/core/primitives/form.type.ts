import type { Injector, Signal } from '@angular/core';

import type { Field } from './field.type';
import type { ArrayNode } from './array.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { ValidationError, ValidationStatus, ValidatorSource, Validators } from '../validation/validation.type';
import type { MarkAsTouchedOptions, Node, NodeDefinition, NodeDefinitions, NodePatch, NodeSet, Nodes, NodeValue, RootNode } from '../types/node.type';

export type FormOptions<TValue = any, TForm extends Form<any> = Form<any>> = {
  /** Synchronous and explicitly marked asynchronous validators applied to the aggregated form value. */
  readonly validators?: ValidatorSource<TValue>;
  /** Optional injector that owns the asynchronous validation watcher lifecycle. */
  readonly injector?: Injector;
  /** Default control-value debounce inherited by descendant fields that do not configure their own debounce. */
  readonly debounce?: number;
  /** Initial hidden state or a Signal, computed Signal, or function evaluated reactively. */
  readonly hidden?: boolean | (() => boolean);
  /** Initial disabled state or a Signal, computed Signal, or function evaluated reactively. */
  readonly disabled?: boolean | (() => boolean);
  /** Initial readonly state or a Signal, computed Signal, or function evaluated reactively. */
  readonly readonly?: boolean | (() => boolean);
  /** Submission behavior used by `submit()` and by a bound native `<form>`. */
  readonly submission?: FormSubmissionOptions<TValue, TForm>;
};

export type FormSubmissionOptions<TValue, TForm extends Form<any> = Form<any>> = {
  /** Runs when submission is allowed by the current validation state. */
  readonly action: (form: TForm, value: TValue) => void | PromiseLike<void>;
  /** Runs instead of `action` when validation blocks submission. */
  readonly onInvalid?: (form: TForm) => void;
  /** Which validation states may be ignored when deciding whether to run `action`. */
  readonly ignoreValidators?: 'pending' | 'none' | 'all';
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
  TNode extends Node ? TNode :
  TNode extends NodeDefinitions ? Form<NormalizedNodes<TNode>> : Node;

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
  value: Signal<{ [K in keyof TNodes]: NodeValue<TNodes[K]> }>;
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
  getError<TKind extends string>(kind: TKind): (ValidationError.WithTargetNode<Form<TNodes, TParent>> & { readonly kind: TKind }) | undefined;
  required: Signal<boolean>;
  pending: Signal<boolean>;
  /** Whether this form or an ancestor form is currently running its submission action. */
  submitting: Signal<boolean>;
  /** Marks the subtree touched and runs its configured submission action when validation allows it. */
  submit(): Promise<boolean>;
  /** Whether any descendant field currently has a pending control-value debounce. */
  debouncing: Signal<boolean>;
  /** Immediately commits every pending control value in this form's subtree. */
  flush(): void;
  validationStatus: Signal<ValidationStatus>;
  touched: Signal<boolean>;
  untouched: Signal<boolean>;
  markAsTouched(options?: MarkAsTouchedOptions): void;
  markAsUntouched(): void;
  dirty: Signal<boolean>;
  pristine: Signal<boolean>;
  markAsDirty(): void;
  markAsPristine(): void;
  disabled: Signal<boolean>;
  enabled: Signal<boolean>;
  disable(): void;
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
  TNode extends Field<infer TValue, Node> ? Field<TValue, TParent> :
  TNode extends Form<infer TNodes, Node> ? Form<TNodes, TParent> :
  TNode extends ArrayNode<infer TItem, Node> ? ArrayNode<TItem, TParent> : TNode;

export type FormChildren<TNodes extends Nodes, TParent extends Node> = {
  readonly [K in keyof TNodes]: NodeWithParent<TNodes[K], Form<TNodes, TParent>>;
};

export type Form<TNodes extends Nodes, TParent extends Node = Node> =
  & { (): { [K in keyof TNodes]: NodeValue<TNodes[K]> }; api: FormApi<TNodes, TParent> }
  & FormChildren<TNodes, TParent>
  & Omit<FormApi<TNodes, TParent>, keyof TNodes>
  & HiddenFunctionMembers<keyof TNodes | keyof FormApi<TNodes, TParent>>;
