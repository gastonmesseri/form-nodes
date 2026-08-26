import type { Signal } from '@angular/core';

import type { Node, PublicNode } from '../types/node.type';

/** A validation error produced by a validator. */
export interface ValidationError {
  /** Identifies the error category. */
  readonly kind: string;
  /** Optional human-readable description of the error. */
  readonly message?: string;
}

export namespace ValidationError {
  /** An error associated with a specific target node. */
  export type WithTargetNode<TNode = unknown> = ValidationError & {
    readonly targetNode: TNode;
  };

  /** An error that may already define its target node. */
  export type WithOptionalTargetNode<TNode = unknown> = ValidationError & {
    readonly targetNode?: TNode;
  };

  /** An error returned by a field validator before its target node is assigned. */
  export type WithoutTargetNode = ValidationError & {
    readonly targetNode?: never;
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
  readonly touched: Signal<boolean>;
  readonly untouched: Signal<boolean>;
  readonly dirty: Signal<boolean>;
  readonly pristine: Signal<boolean>;
  readonly disabled: Signal<boolean>;
  readonly enabled: Signal<boolean>;
  readonly readonly: Signal<boolean>;
  readonly writable: Signal<boolean>;
  readonly hidden: Signal<boolean>;
  readonly visible: Signal<boolean>;
};

/** Common node API exposed to validators when no exact owner API is specified. */
export type ValidatorApi<TValue> = AsyncValidatorState & {
  readonly form: Signal<PublicNode<Node> | null>;
  readonly parent: Signal<PublicNode<Node> | null>;
  readonly path: Signal<readonly string[]>;
  readonly value: Signal<TValue>;
  readonly errors: Signal<readonly ValidationError[]>;
  readonly valid: Signal<boolean>;
  readonly invalid: Signal<boolean>;
  readonly pending: Signal<boolean>;
  readonly validationStatus: Signal<ValidationStatus>;
  set(value: TValue): void;
  reset(...args: [] | [value: TValue]): void;
  markAsTouched(): void;
  markAsUntouched(): void;
  markAsDirty(): void;
  markAsPristine(): void;
  disable(): void;
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

export type SubscriptionLike = {
  unsubscribe(): void;
};

export type ObserverLike<TValue> = {
  next(value: TValue): void;
  error(error: unknown): void;
  complete(): void;
};

export type ObservableLike<TValue> = {
  subscribe(observer: ObserverLike<TValue>): SubscriptionLike;
};

export type AsyncValidationResult = PromiseLike<ValidationResult> | ObservableLike<ValidationResult>;

export type Validator<TValue> = (context: FieldContext<TValue>) => ValidationResult;

export type AsyncValidator<TValue> = Validator<TValue>;

export type Validators<TValue> = readonly ((context: ValidatorContext<TValue>) => ValidationResult)[];
