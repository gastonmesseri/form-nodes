import type { Signal } from '@angular/core';

import type { FormApi } from '../primitives/form.type';
import type { GroupApi } from '../primitives/group.type';
import type { FieldNode } from '../primitives/field.type';
import type { ArrayNode } from '../primitives/array.type';
import type { ObservableLike } from '../types/observable-like.type';
import type { CallableNodeApi } from '../types/callable-node-api.type';
import type { NodeValueSignal } from '../types/node-value-signal.type';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { DisabledReason, DynamicNode, AnyNode, PublicNode } from '../types/node.type';

/** A validation error produced by a validator. */
export interface ValidationError {
  /** Identifies the error category. */
  readonly kind: string;
  /** Optional human-readable description of the error. */
  readonly message?: string;
}

/** Built-in validation errors keyed by their discriminating `kind`. */
export interface BuiltInValidationErrorMap {
  readonly required: ValidationError & { readonly kind: 'required' };
  readonly email: ValidationError & { readonly kind: 'email' };
  readonly url: ValidationError & { readonly kind: 'url' };
  readonly equalTo: ValidationError & { readonly kind: 'equalTo' };
  readonly uniqueItems: ValidationError & {
    readonly kind: 'uniqueItems';
    /** Ascending indexes of every item participating in a duplicate group. */
    readonly duplicateIndexes: readonly number[];
  };
  readonly between: ValidationError & {
    readonly kind: 'between';
    /** Resolved inclusive minimum required by the validator. */
    readonly min: number;
    /** Resolved inclusive maximum allowed by the validator. */
    readonly max: number;
    /** Rejected numeric value. */
    readonly actual: number;
  };
  readonly min: ValidationError & {
    readonly kind: 'min';
    /** Resolved minimum required by the validator. */
    readonly min: number;
    /** Rejected numeric value. */
    readonly actual: number;
  };
  readonly max: ValidationError & {
    readonly kind: 'max';
    /** Resolved maximum allowed by the validator. */
    readonly max: number;
    /** Rejected numeric value. */
    readonly actual: number;
  };
  readonly integer: ValidationError & {
    readonly kind: 'integer';
    /** Rejected numeric value. */
    readonly actual: number;
  };
  readonly minLength: ValidationError & {
    readonly kind: 'minLength';
    /** Resolved minimum length or size required by the validator. */
    readonly minLength: number;
    /** Observed length or size of the rejected value. */
    readonly actual: number;
  };
  readonly maxLength: ValidationError & {
    readonly kind: 'maxLength';
    /** Resolved maximum length or size allowed by the validator. */
    readonly maxLength: number;
    /** Observed length or size of the rejected value. */
    readonly actual: number;
  };
  readonly pattern: ValidationError & {
    readonly kind: 'pattern';
    /** Resolved regular expression required by the validator. */
    readonly pattern: RegExp;
    /** Rejected string value. */
    readonly actual: string;
  };
  readonly minDate: ValidationError & {
    readonly kind: 'minDate';
    /** Resolved earliest date allowed by the validator. */
    readonly minDate: Date;
    /** Rejected date value. */
    readonly actual: Date;
  };
  readonly maxDate: ValidationError & {
    readonly kind: 'maxDate';
    /** Resolved latest date allowed by the validator. */
    readonly maxDate: Date;
    /** Rejected date value. */
    readonly actual: Date;
  };
  readonly dateBetween: ValidationError & {
    readonly kind: 'dateBetween';
    /** Resolved inclusive earliest date required by the validator. */
    readonly minDate: Date;
    /** Resolved inclusive latest date allowed by the validator. */
    readonly maxDate: Date;
    /** Rejected date value. */
    readonly actual: Date;
  };
  readonly oneOf: ValidationError & {
    readonly kind: 'oneOf';
    /** Resolved collection of allowed values. */
    readonly options: readonly unknown[];
    /** Rejected value that was absent from `options`. */
    readonly actual: unknown;
  };
  readonly minWords: ValidationError & {
    readonly kind: 'minWords';
    /** Resolved minimum word count required by the validator. */
    readonly minWords: number;
    /** Observed word count. */
    readonly actual: number;
  };
  readonly maxWords: ValidationError & {
    readonly kind: 'maxWords';
    /** Resolved maximum word count allowed by the validator. */
    readonly maxWords: number;
    /** Observed word count. */
    readonly actual: number;
  };
}

/** Extensible registry used to resolve structured errors by their discriminating `kind`. */
export interface ValidationErrorMap extends BuiltInValidationErrorMap {}

/** Union of every validation error provided by the library. */
export type BuiltInValidationError = BuiltInValidationErrorMap[keyof BuiltInValidationErrorMap];

/** A custom validation error whose additional application-specific properties remain unknown. */
export type CustomValidationError<TKind extends string = string> = ValidationError
  & Readonly<Record<string, unknown>>
  & { readonly kind: TKind };

/** Resolves a known error kind to its structured type, with a generic fallback for custom kinds. */
export type ValidationErrorForKind<TKind extends string> = (
  TKind extends keyof ValidationErrorMap ? ValidationErrorMap[TKind] : CustomValidationError<TKind>
) & { readonly kind: TKind };

/** An error associated with a specific target node. */
export type ValidationErrorWithTargetNode<TNode = unknown> = ValidationError & {
  /**
   * Node whose validation state owns this error.
   *
   * When the error is read from an ancestor aggregate through `allErrors()`, this remains the
   * original field, form, or array that produced the error rather than the observing ancestor.
   */
  readonly targetNode: TNode;
  /** Concrete control binding that produced this error, when the error is binding-specific. */
  readonly formNode?: FormNodeBinding;
};

/** An error that may already define its target node. */
export type ValidationErrorWithOptionalTargetNode<TNode = unknown> = ValidationError & {
  /**
   * Node whose validation state should own this error, when explicitly provided.
   *
   * Validators may omit it to target the node currently being validated. The validation
   * pipeline then assigns that node before exposing the error through `errors()` or
   * `allErrors()`.
   */
  readonly targetNode?: TNode;
  /** Concrete control binding that produced this error, when the error is binding-specific. */
  readonly formNode?: FormNodeBinding;
};

/** An error returned by a field validator before its target node is assigned. */
export type ValidationErrorWithoutTargetNode = ValidationError & {
  readonly targetNode?: never;
  readonly formNode?: never;
};

/** An error returned by a validator, optionally assigned to another node. */
export type ValidatorError<TNode extends AnyNode = AnyNode> = ValidationError & {
  /**
   * Node that should own this error.
   *
   * Omit this property to target the node currently being validated. Set it for cross-field or
   * aggregate validation whose error should be displayed by a specific descendant.
   */
  readonly targetNode?: TNode;
  readonly formNode?: never;
};

/** Indicates that validation completed without errors. */
export type ValidationSuccess = null | undefined | void;

/** A successful result, an error or message, or several errors and messages. Strings become errors with kind 'custom', including empty strings. */
export type ValidationResult =
  | ValidationSuccess
  | string
  | ValidatorError
  | readonly (string | ValidatorError)[];

/** Reactive context available to validation functions for the current field. */
export type FieldContext<TValue> = {
  /** Current value of the node being validated. Reading it creates a reactive dependency. */
  readonly value: Signal<TValue>;
};

/** Non-validation state available through the validated node API. */
export type AsyncValidatorState = {
  /** Whether this node or an ancestor form is currently running its submission action. */
  readonly submitting: Signal<boolean>;
  /** Whether this node has been marked as interacted with. */
  readonly touched: Signal<boolean>;
  /** Logical inverse of `touched()`; true until this node is marked as touched. */
  readonly untouched: Signal<boolean>;
  /** Whether user interaction or `markAsDirty()` has recorded this node as modified. */
  readonly dirty: Signal<boolean>;
  /** Logical inverse of `dirty()`; true while the node does not report user modification. */
  readonly pristine: Signal<boolean>;
  /** Whether this node is excluded from validation and aggregate values. */
  readonly disabled: Signal<boolean>;
  /** Active reasons that currently make this node disabled. */
  readonly disabledReasons: Signal<readonly DisabledReason[]>;
  /** Logical inverse of `disabled()`; true while the node participates normally. */
  readonly enabled: Signal<boolean>;
  /** Whether consumers should prevent the user from editing this node. */
  readonly readonly: Signal<boolean>;
  /** Logical inverse of `readonly()`; true while the node may be edited. */
  readonly writable: Signal<boolean>;
  /** Whether consumers should omit this node from the visible UI. */
  readonly hidden: Signal<boolean>;
  /** Logical inverse of `hidden()`; true while the node should be displayed. */
  readonly visible: Signal<boolean>;
  /** Whether the current validation rules require this node to contain a value. */
  readonly required: Signal<boolean>;
};

/** Callable form API when the declaration's child keys are not known. */
type ValidatorForm = PublicNode<AnyNode> & FormApi<any> & { api: CallableNodeApi<FormApi<any>>; $api: CallableNodeApi<FormApi<any>> };

/** Callable group API when the declaration's child keys are not known. */
type ValidatorGroup = PublicNode<AnyNode> & GroupApi<any> & { api: CallableNodeApi<GroupApi<any>>; $api: CallableNodeApi<GroupApi<any>> };

type UntypedValidatorNode = FieldNode<any> | ValidatorForm | ValidatorGroup | ArrayNode<DynamicNode>;

/** Preserves each primitive's members while specializing its committed-value access paths. */
type ValidatorValueNode<TValue, TNode extends AnyNode = UntypedValidatorNode> = TNode extends UntypedValidatorNode
  ? Omit<TNode, 'value' | 'api' | '$api'> & HiddenFunctionMembers<keyof TNode> & {
    (): TValue;
    value: NodeValueSignal<TValue>;
    api: CallableNodeApi<Omit<TNode['api'], 'value'> & { value: NodeValueSignal<TValue> }>;
    $api: CallableNodeApi<Omit<TNode['$api'], 'value'> & { value: NodeValueSignal<TValue> }>;
  }
  : never;

/** Callable node API with a known value type but an unspecified primitive kind. */
export type ValidatorNode<TValue = any> = ValidatorValueNode<TValue>;

/** Common node API exposed to validators when no exact owner API is specified. */
export type ValidatorApi<TValue> = AsyncValidatorState & {
  /**
   * Nearest explicit form workflow, or `null` when none owns the validated node.
   * Exposes the complete form API directly; unknown child keys are available through `get()`.
   */
  readonly form: Signal<ValidatorForm | null>;
  /**
   * Complete structural root, including a standalone field. Common node members are available
   * directly; narrow the node kind before using primitive-specific operations.
   */
  readonly root: Signal<ValidatorNode>;
  /**
   * Immediate form, group, or array parent, or `null` for a standalone node.
   * Common node members are available directly. A field can never be a parent.
   */
  readonly parent: Signal<ValidatorForm | ValidatorGroup | ArrayNode<DynamicNode> | null>;
  /** Property names and array indexes locating the node from its root. */
  readonly path: Signal<readonly string[]>;
  /** Current committed value of the node being validated. */
  readonly value: Signal<TValue>;
  /** Validation errors owned directly by this node. */
  readonly errors: Signal<readonly ValidationError[]>;
  /** Errors owned by this node and every descendant. */
  readonly allErrors: Signal<readonly ValidationError[]>;
  /** Whether this node and its descendants have no active errors or unresolved validation. */
  readonly valid: Signal<boolean>;
  /** Whether this node or a descendant currently contributes an error. False while unknown. */
  readonly invalid: Signal<boolean>;
  /** Whether asynchronous validation is running on this node or a descendant. */
  readonly pending: Signal<boolean>;
  /** Whether asynchronous validation is waiting for its debounce delay. */
  readonly debouncing: Signal<boolean>;
  /** Current aggregate result: valid, invalid, or unknown while validation is unresolved. */
  readonly validationStatus: Signal<ValidationStatus>;
  /**
   * Returns this node's first direct error with `kind`, or `undefined` when none exists.
   *
   * @reactive Reads the current direct-error collection on every call.
   */
  getError<TKind extends string>(kind: TKind): ValidationErrorForKind<TKind> | undefined;
  /** Replaces the node's committed value and triggers the corresponding state and validation updates. */
  set(value: TValue): void;
  /** Replaces the value with the result of applying `updater` to its current committed value. */
  update(updater: (value: TValue) => TValue): void;
  /** Commits any buffered control value immediately and runs validation that was waiting for it. */
  flush(): void;
  /** Clears interaction state; preserves the current value unless a replacement is provided. */
  reset(...args: [] | [value: TValue]): void;
  /** Marks this node as touched and, unless skipped, propagates the operation to descendants. */
  markAsTouched(options?: {
    /** When true, marks only the validated node and leaves its descendants untouched. */
    skipDescendants?: boolean;
  }): void;
  /** Marks this node as untouched without changing its value. */
  markAsUntouched(): void;
  /** Marks this node as dirty without changing its value. */
  markAsDirty(): void;
  /** Clears stored dirty state without changing the current value. */
  markAsPristine(): void;
  /** Adds an imperative disabled reason, excluding this node from validation and aggregate values. */
  disable(message?: string): void;
  /** Removes disabled reasons previously added through `disable()`. */
  enable(): void;
  /** Adds the imperative readonly state, making `readonly()` true. */
  markAsReadonly(): void;
  /** Removes the readonly state previously added through `markAsReadonly()`. */
  markAsWritable(): void;
  /** Adds the imperative hidden state, making `visible()` false. */
  hide(): void;
  /** Removes the hidden state previously added through `hide()`, making `visible()` true. */
  show(): void;
};

/** Mutable node API exposed to asynchronous validators by default. */
export type AsyncValidatorApi<TValue> = ValidatorApi<TValue>;

/** Reactive value and navigation shared by all validator context specializations. */
export type ValidatorReadonlyApi<TValue> = FieldContext<TValue> & {
  /** Immediate parent inferred by a specialized validator API. */
  readonly parent: Signal<any>;
  /** Property names and array indexes locating the validated node from its root. */
  readonly path: Signal<readonly string[]>;
};

/**
 * Reactive context provided to synchronous validators.
 * Generic public owners retain TValue on their node value reads. Concrete owners and partial
 * structural owner contracts remain exact; only the common owner exposes every node kind.
 */
export type ValidatorContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = ValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = Pick<TApi, 'parent' | 'path'> & {
  /** Current committed value of the node being validated. */
  readonly value: ValidatorNode extends TField ? TApi['value'] : TField['$api']['value'];
  /**
   * Readonly signal of the node being validated.
   * `ctx.node()` and `ctx.field()` return the same node. Read its value with `ctx.value()`.
   */
  readonly field: Signal<ValidatorNode extends TField ? 'nodeType' extends keyof TField ? ValidatorNode<TValue> : TField : TField>;
  /**
   * Readonly signal of the node being validated.
   * `ctx.node()` and `ctx.field()` return the same node. Read its value with `ctx.value()`.
   */
  readonly node: Signal<ValidatorNode extends TField ? 'nodeType' extends keyof TField ? ValidatorNode<TValue> : TField : TField>;
};

/** Reactive context shared by asynchronous validator conditions, params, and handlers. */
export type AsyncValidatorBaseContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = ValidatorContext<TValue, TApi, TField>;

/**
 * Aggregate validation result.
 *
 * `unknown` means that the final result is not available yet because asynchronous validation is
 * pending or debouncing. It does not mean that the node has an unknown value type.
 */
export type ValidationStatus = 'valid' | 'invalid' | 'unknown';

/** Reactive node context and cancellation signal provided to an asynchronous validator run. */
export type AsyncValidatorContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = AsyncValidatorBaseContext<TValue, TApi, TField> & {
  /**
   * Cancellation signal for this execution.
   *
   * It aborts when a newer execution supersedes this one or the validator is deactivated. Pass it
   * to APIs such as `fetch()` so obsolete work stops promptly; stale results are ignored anyway.
   */
  readonly abortSignal: AbortSignal;
};

/** Asynchronous validator context extended with the current reactive parameter snapshot. */
export type ParameterizedAsyncValidatorContext<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = AsyncValidatorContext<TValue, TApi, TField> & {
  /** Snapshot returned by the validator's reactive `params` function. */
  readonly params: TParams;
};

/** Promise-like or observable-like result accepted from an asynchronous validator. */
export type AsyncValidationResult = PromiseLike<ValidationResult> | ObservableLike<ValidationResult>;

/** Synchronous validator receiving the current value as a reactive signal. */
export type Validator<TValue> = (context: FieldContext<TValue>) => ValidationResult;

/** Resolves an unspecified helper owner to the common public node API while preserving reuse. */
export type ValidatorOwner<TNode extends AnyNode> = AnyNode extends TNode ? ValidatorNode : TNode;

/** Validator marked by `asyncValidator()` for asynchronous scheduling and cancellation. */
export type AsyncValidator<TValue, TField extends AnyNode = AnyNode> = (context: ValidatorContext<TValue, ValidatorApi<TValue>, TField>) => ValidationResult;

/** Validator that may return errors directly or compose one or more validators dynamically. */
export type ComposableValidator<TValue, TField extends AnyNode = ValidatorNode> = (context: ValidatorContext<TValue, ValidatorApi<TValue>, TField>) => ComposableValidationResult<TValue, TField>;

/** Result accepted from a composable validator, including nested validators and successful entries. */
export type ComposableValidationResult<TValue, TField extends AnyNode = ValidatorNode> =
  | ValidationResult
  | Validator<TValue>
  | ComposableValidator<TValue, TField>
  | readonly (ComposableValidator<TValue, TField> | ValidationSuccess)[];

/** Readonly normalized collection of composable validators for a node value. */
export type Validators<TValue, TField extends AnyNode = ValidatorNode> = readonly ComposableValidator<TValue, TField>[];

// A shared first branch keeps contextual return typing stable across repeated instantiations.
export type DeferredValidator = () => any;

/**
 * One validator or a readonly list in which `null` and `undefined` represent no validator.
 *
 * Parameterless callbacks have an intentionally unchecked return type so a class initializer
 * can reference its own form without a return annotation. Context-taking validators retain
 * their checked context and result, including when authored through `validator()`.
 * The runner still accepts only synchronous validation results or synchronous compositions.
 * Overloaded functions callable without arguments also match the unchecked callback branch.
 */
export type ValidatorSource<TValue, TField extends AnyNode = ValidatorNode> =
  | DeferredValidator
  | ComposableValidator<TValue, TField>
  // Tuple contextual typing avoids comparing a deferred callback's return with sibling entries.
  | readonly [
    validator?: DeferredValidator | ComposableValidator<TValue, TField> | ValidationSuccess,
    ...validators: (DeferredValidator | ComposableValidator<TValue, TField> | ValidationSuccess)[]
  ];
