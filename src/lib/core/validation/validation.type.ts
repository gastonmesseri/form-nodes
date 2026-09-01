import type { Signal } from '@angular/core';

import type { ObservableLike } from '../types/observable-like.type';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import type { DisabledReason, MarkAsTouchedOptions, Node, PublicNode } from '../types/node.type';

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

export namespace ValidationError {
  /** Resolves a known error kind to its structured type, with a generic fallback for custom kinds. */
  export type ForKind<TKind extends string> = (
    TKind extends keyof ValidationErrorMap ? ValidationErrorMap[TKind] : CustomValidationError<TKind>
  ) & { readonly kind: TKind };

  /** An error associated with a specific target node. */
  export type WithTargetNode<TNode = unknown> = ValidationError & {
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
  export type WithOptionalTargetNode<TNode = unknown> = ValidationError & {
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
  export type WithoutTargetNode = ValidationError & {
    readonly targetNode?: never;
    readonly formNode?: never;
  };
}

/** Indicates that validation completed without errors. */
export type ValidationSuccess = null | undefined | void;

/** A successful result, one validation error, or several validation errors. */
export type ValidationResult =
  | ValidationSuccess
  | ValidationError.WithoutTargetNode
  | readonly ValidationError.WithoutTargetNode[];

/** Reactive context available to validation functions for the current field. */
export type FieldContext<TValue> = {
  /** Signal containing the current field value. */
  readonly value: Signal<TValue>;
};

/** Non-validation state exposed to validator callbacks. */
export type AsyncValidatorState = {
  readonly submitting: Signal<boolean>;
  readonly touched: Signal<boolean>;
  readonly untouched: Signal<boolean>;
  readonly dirty: Signal<boolean>;
  readonly pristine: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly disabledReasons: Signal<readonly DisabledReason[]>;
  readonly enabled: Signal<boolean>;
  readonly readonly: Signal<boolean>;
  readonly writable: Signal<boolean>;
  readonly hidden: Signal<boolean>;
  readonly visible: Signal<boolean>;
  readonly required: Signal<boolean>;
};

/** Common node API exposed to validators when no exact owner API is specified. */
export type ValidatorApi<TValue> = AsyncValidatorState & {
  readonly form: Signal<PublicNode<Node> | null>;
  readonly parent: Signal<PublicNode<Node> | null>;
  readonly path: Signal<readonly string[]>;
  readonly value: Signal<TValue>;
  readonly errors: Signal<readonly ValidationError[]>;
  readonly allErrors: Signal<readonly ValidationError[]>;
  readonly valid: Signal<boolean>;
  readonly invalid: Signal<boolean>;
  readonly pending: Signal<boolean>;
  readonly debouncing: Signal<boolean>;
  readonly validationStatus: Signal<ValidationStatus>;
  getError<TKind extends string>(kind: TKind): ValidationError.ForKind<TKind> | undefined;
  set(value: TValue): void;
  update(updater: (value: TValue) => TValue): void;
  flush(): void;
  reset(...args: [] | [value: TValue]): void;
  markAsTouched(options?: MarkAsTouchedOptions): void;
  markAsUntouched(): void;
  markAsDirty(): void;
  markAsPristine(): void;
  disable(message?: string): void;
  enable(): void;
  markAsReadonly(): void;
  markAsWritable(): void;
  hide(): void;
  show(): void;
};

export type AsyncValidatorApi<TValue> = ValidatorApi<TValue>;

export type ValidatorReadonlyApi<TValue> = FieldContext<TValue> & AsyncValidatorState & {
  readonly form: Signal<any>;
  readonly parent: Signal<any>;
  readonly path: Signal<readonly string[]>;
};

/** Reactive context provided to synchronous validators. */
export type ValidatorContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = ValidatorApi<TValue>, TField extends Node = Node> = Pick<TApi, keyof ValidatorReadonlyApi<TValue>> & {
  readonly api: TApi;
  readonly field: TField;
};

/** Reactive context shared by asynchronous validator conditions, params, and handlers. */
export type AsyncValidatorBaseContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends Node = Node> = ValidatorContext<TValue, TApi, TField>;

export type ValidationStatus = 'valid' | 'invalid' | 'unknown';

export type AsyncValidatorContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends Node = Node> = AsyncValidatorBaseContext<TValue, TApi, TField> & {
  readonly abortSignal: AbortSignal;
};

export type ParameterizedAsyncValidatorContext<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends Node = Node> = AsyncValidatorContext<TValue, TApi, TField> & {
  /** Snapshot returned by the validator's reactive `params` function. */
  readonly params: TParams;
};

export type AsyncValidationResult = PromiseLike<ValidationResult> | ObservableLike<ValidationResult>;

export type Validator<TValue> = (context: FieldContext<TValue>) => ValidationResult;

export type AsyncValidator<TValue> = Validator<TValue>;

export type ComposableValidator<TValue> = (context: ValidatorContext<TValue>) => ComposableValidationResult<TValue>;

export type ComposableValidationResult<TValue> =
  | ValidationResult
  | Validator<TValue>
  | ComposableValidator<TValue>
  | readonly (ComposableValidator<TValue> | ValidationSuccess)[];

export type Validators<TValue> = readonly ComposableValidator<TValue>[];

export type ValidatorSource<TValue> =
  | ComposableValidator<TValue>
  | readonly (ComposableValidator<TValue> | ValidationSuccess)[];
