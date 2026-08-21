import type { Signal } from '@angular/core';

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

export type ValidationStatus = 'valid' | 'invalid' | 'unknown';

export type AsyncValidatorContext<TValue> = FieldContext<TValue> & {
  readonly abortSignal: AbortSignal;
};

export type ParameterizedAsyncValidatorContext<TValue, TParams> = AsyncValidatorContext<TValue> & {
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

export type Validators<TValue> = readonly Validator<TValue>[];
