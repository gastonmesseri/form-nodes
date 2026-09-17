import type { Signal } from '@angular/core';

import type { FormApi } from '../primitives/form.type';
import type { GroupApi } from '../primitives/group.type';
import type { FieldNode } from '../primitives/field.type';
import type { ArrayNode } from '../primitives/array.type';
import type { ObservableLike } from '../types/observable-like.type';
import type { CallableNodeApi } from '../types/callable-node-api.type';
import type { NodeValueSignal } from '../types/node-value-signal.type';
import type { FormNodeBinding } from '../types/form-node-binding.type';
import type { NodeErrorsSignal } from '../types/node-errors-signal.type';
import type { DisabledReason, DynamicNode, AnyNode } from '../types/node.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { ValidatorNodeView, ValidatorValueSignal } from './validator-node-view.type';

/**
 * A validation error produced by a validator.
 *
 * ```ts
 * const error: ValidationError = {
 *   kind: 'unavailable',
 *   message: 'Try another name.',
 * };
 * error.kind; // 'unavailable'
 * ```
 */
export interface ValidationError {
  /**
   * Identifies the error category.
   *
   * ```ts
   * const error: ValidationError = {
   *   kind: 'unavailable',
   *   message: 'Try another name.',
   * };
   * error.kind; // 'unavailable'
   * ```
   */
  readonly kind: string;
  /**
   * Optional human-readable description of the error.
   *
   * **Default:** `undefined`; this error provides no message text.
   *
   * ```ts
   * const error: ValidationError = {
   *   kind: 'unavailable',
   *   message: 'Try another name.',
   * };
   * error.message; // 'Try another name.'
   * ```
   */
  readonly message?: string;
}

/**
 * Built-in validation errors keyed by their discriminating `kind`.
 *
 * ```ts
 * const error: ValidationErrorMap['min'] = {
 *   kind: 'min',
 *   min: 18,
 *   actual: 16,
 * };
 * error.min; // 18
 * ```
 */
export interface BuiltInValidationErrorMap {
  readonly required: ValidationError & { readonly kind: 'required' };
  readonly requiredTrue: ValidationError & { readonly kind: 'requiredTrue' };
  readonly notNil: ValidationError & { readonly kind: 'notNil' };
  readonly email: ValidationError & { readonly kind: 'email' };
  readonly url: ValidationError & { readonly kind: 'url' };
  readonly equalTo: ValidationError & { readonly kind: 'equalTo' };
  readonly uniqueItems: ValidationError & {
    readonly kind: 'uniqueItems';
    /**
     * Ascending indexes of every item participating in a duplicate group.
     *
     * ```ts
     * const node = field(
     *   ['a', 'a'],
     *   [uniqueItems],
     * );
     * const error = node.getError('uniqueItems');
     * error?.duplicateIndexes; // [0, 1]
     * ```
     */
    readonly duplicateIndexes: readonly number[];
  };
  readonly between: ValidationError & {
    readonly kind: 'between';
    /**
     * Resolved inclusive minimum required by the validator.
     *
     * ```ts
     * const node = field(16, [between(18, 65)]);
     * const error = node.getError('between');
     * error?.min; // 18
     * ```
     */
    readonly min: number;
    /**
     * Resolved inclusive maximum allowed by the validator.
     *
     * ```ts
     * const node = field(16, [between(18, 65)]);
     * const error = node.getError('between');
     * error?.max; // 65
     * ```
     */
    readonly max: number;
    /**
     * Rejected numeric value.
     *
     * ```ts
     * const node = field(16, [between(18, 65)]);
     * const error = node.getError('between');
     * error?.actual; // 16
     * ```
     */
    readonly actual: number;
  };
  readonly min: ValidationError & {
    readonly kind: 'min';
    /**
     * Resolved minimum required by the validator.
     *
     * ```ts
     * const node = field(16, [min(18)]);
     * const error = node.getError('min');
     * error?.min; // 18
     * ```
     */
    readonly min: number;
    /**
     * Rejected numeric value.
     *
     * ```ts
     * const node = field(16, [min(18)]);
     * const error = node.getError('min');
     * error?.actual; // 16
     * ```
     */
    readonly actual: number;
  };
  readonly max: ValidationError & {
    readonly kind: 'max';
    /**
     * Resolved maximum allowed by the validator.
     *
     * ```ts
     * const node = field(70, [max(65)]);
     * const error = node.getError('max');
     * error?.max; // 65
     * ```
     */
    readonly max: number;
    /**
     * Rejected numeric value.
     *
     * ```ts
     * const node = field(70, [max(65)]);
     * const error = node.getError('max');
     * error?.actual; // 70
     * ```
     */
    readonly actual: number;
  };
  readonly integer: ValidationError & {
    readonly kind: 'integer';
    /**
     * Rejected numeric value.
     *
     * ```ts
     * const node = field(1.5, [integer]);
     * const error = node.getError('integer');
     * error?.actual; // 1.5
     * ```
     */
    readonly actual: number;
  };
  readonly minLength: ValidationError & {
    readonly kind: 'minLength';
    /**
     * Resolved minimum length or size required by the validator.
     *
     * ```ts
     * const node = field('ab', [minLength(3)]);
     * const error = node.getError('minLength');
     * error?.minLength; // 3
     * ```
     */
    readonly minLength: number;
    /**
     * Observed length or size of the rejected value.
     *
     * ```ts
     * const node = field('ab', [minLength(3)]);
     * const error = node.getError('minLength');
     * error?.actual; // 2
     * ```
     */
    readonly actual: number;
  };
  readonly maxLength: ValidationError & {
    readonly kind: 'maxLength';
    /**
     * Resolved maximum length or size allowed by the validator.
     *
     * ```ts
     * const node = field('abcd', [maxLength(3)]);
     * const error = node.getError('maxLength');
     * error?.maxLength; // 3
     * ```
     */
    readonly maxLength: number;
    /**
     * Observed length or size of the rejected value.
     *
     * ```ts
     * const node = field('abcd', [maxLength(3)]);
     * const error = node.getError('maxLength');
     * error?.actual; // 4
     * ```
     */
    readonly actual: number;
  };
  readonly pattern: ValidationError & {
    readonly kind: 'pattern';
    /**
     * Resolved regular expression required by the validator.
     *
     * ```ts
     * const node = field('123', [
     *   pattern(/^[a-z]+$/),
     * ]);
     * const error = node.getError('pattern');
     * error?.pattern?.toString(); // '/^[a-z]+$/'
     * ```
     */
    readonly pattern: RegExp;
    /**
     * Rejected string value.
     *
     * ```ts
     * const node = field('123', [
     *   pattern(/^[a-z]+$/),
     * ]);
     * const error = node.getError('pattern');
     * error?.actual; // '123'
     * ```
     */
    readonly actual: string;
  };
  readonly minDate: ValidationError & {
    readonly kind: 'minDate';
    /**
     * Resolved earliest date allowed by the validator.
     *
     * ```ts
     * const node = field(new Date('2025-01-01'), [
     *   minDate('2026-01-01'),
     * ]);
     * const error = node.getError('minDate');
     * error?.minDate?.getUTCFullYear(); // 2026
     * ```
     */
    readonly minDate: Date;
    /**
     * Rejected date value.
     *
     * ```ts
     * const node = field(new Date('2025-01-01'), [
     *   minDate('2026-01-01'),
     * ]);
     * const error = node.getError('minDate');
     * error?.actual?.getUTCFullYear(); // 2025
     * ```
     */
    readonly actual: Date;
  };
  readonly maxDate: ValidationError & {
    readonly kind: 'maxDate';
    /**
     * Resolved latest date allowed by the validator.
     *
     * ```ts
     * const node = field(new Date('2027-01-01'), [
     *   maxDate('2026-01-01'),
     * ]);
     * const error = node.getError('maxDate');
     * error?.maxDate?.getUTCFullYear(); // 2026
     * ```
     */
    readonly maxDate: Date;
    /**
     * Rejected date value.
     *
     * ```ts
     * const node = field(new Date('2027-01-01'), [
     *   maxDate('2026-01-01'),
     * ]);
     * const error = node.getError('maxDate');
     * error?.actual?.getUTCFullYear(); // 2027
     * ```
     */
    readonly actual: Date;
  };
  readonly dateBetween: ValidationError & {
    readonly kind: 'dateBetween';
    /**
     * Resolved inclusive earliest date required by the validator.
     *
     * ```ts
     * const node = field(new Date('2025-01-01'), [
     *   dateBetween('2026-01-01', '2026-12-31'),
     * ]);
     * const error = node.getError('dateBetween');
     * error?.minDate?.getUTCFullYear(); // 2026
     * ```
     */
    readonly minDate: Date;
    /**
     * Resolved inclusive latest date allowed by the validator.
     *
     * ```ts
     * const node = field(new Date('2025-01-01'), [
     *   dateBetween('2026-01-01', '2026-12-31'),
     * ]);
     * const error = node.getError('dateBetween');
     * error?.maxDate?.getUTCFullYear(); // 2026
     * ```
     */
    readonly maxDate: Date;
    /**
     * Rejected date value.
     *
     * ```ts
     * const node = field(new Date('2025-01-01'), [
     *   dateBetween('2026-01-01', '2026-12-31'),
     * ]);
     * const error = node.getError('dateBetween');
     * error?.actual?.getUTCFullYear(); // 2025
     * ```
     */
    readonly actual: Date;
  };
  readonly oneOf: ValidationError & {
    readonly kind: 'oneOf';
    /**
     * Resolved collection of allowed values.
     *
     * ```ts
     * const node = field('draft', [
     *   oneOf(['published']),
     * ]);
     * const error = node.getError('oneOf');
     * error?.options; // ['published']
     * ```
     */
    readonly options: readonly unknown[];
    /**
     * Rejected value that was absent from `options`.
     *
     * ```ts
     * const node = field('draft', [
     *   oneOf(['published']),
     * ]);
     * const error = node.getError('oneOf');
     * error?.actual; // 'draft'
     * ```
     */
    readonly actual: unknown;
  };
  readonly minWords: ValidationError & {
    readonly kind: 'minWords';
    /**
     * Resolved minimum word count required by the validator.
     *
     * ```ts
     * const node = field('One two', [minWords(3)]);
     * const error = node.getError('minWords');
     * error?.minWords; // 3
     * ```
     */
    readonly minWords: number;
    /**
     * Observed word count.
     *
     * ```ts
     * const node = field('One two', [minWords(3)]);
     * const error = node.getError('minWords');
     * error?.actual; // 2
     * ```
     */
    readonly actual: number;
  };
  readonly maxWords: ValidationError & {
    readonly kind: 'maxWords';
    /**
     * Resolved maximum word count allowed by the validator.
     *
     * ```ts
     * const node = field('One two three', [
     *   maxWords(2),
     * ]);
     * const error = node.getError('maxWords');
     * error?.maxWords; // 2
     * ```
     */
    readonly maxWords: number;
    /**
     * Observed word count.
     *
     * ```ts
     * const node = field('One two three', [
     *   maxWords(2),
     * ]);
     * const error = node.getError('maxWords');
     * error?.actual; // 3
     * ```
     */
    readonly actual: number;
  };
}

/**
 * Extensible registry used to resolve structured errors by their discriminating `kind`.
 *
 * ```ts
 * const error: ValidationErrorMap['min'] = {
 *   kind: 'min',
 *   min: 18,
 *   actual: 16,
 * };
 * error.min; // 18
 * ```
 */
export interface ValidationErrorMap extends BuiltInValidationErrorMap {}

/**
 * Union of every validation error provided by the library.
 *
 * ```ts
 * const error: BuiltInValidationError = {
 *   kind: 'min',
 *   min: 18,
 *   actual: 16,
 * };
 * error.min; // 18
 * ```
 */
export type BuiltInValidationError = BuiltInValidationErrorMap[keyof BuiltInValidationErrorMap];

/**
 * A custom validation error whose additional application-specific properties remain unknown.
 *
 * ```ts
 * const error: CustomValidationError = {
 *   kind: 'unavailable',
 *   message: 'Try another name.',
 * };
 * error.kind; // 'unavailable'
 * ```
 */
export type CustomValidationError<TKind extends string = string> = ValidationError
  & Readonly<Record<string, unknown>>
  & { readonly kind: TKind };

/**
 * Resolves a known error kind to its structured type, with a generic fallback for custom kinds.
 *
 * ```ts
 * const error: ValidationErrorForKind<'min'> =
 *   {
 *     kind: 'min',
 *     min: 18,
 *     actual: 16,
 *   };
 * error.min; // 18
 * ```
 */
export type ValidationErrorForKind<TKind extends string> = (
  TKind extends keyof ValidationErrorMap ? ValidationErrorMap[TKind] : CustomValidationError<TKind>
) & { readonly kind: TKind };

/**
 * An error associated with a specific target node.
 *
 * ```ts
 * const node = field('Ada');
 * const error = {
 *   kind: 'unavailable',
 *   targetNode: node,
 * };
 * error.targetNode === node; // true
 * ```
 */
export type ValidationErrorWithTargetNode<TNode = unknown> = ValidationError & {
  /**
   * Node whose validation state owns this error.
   *
   * When the error is read from an ancestor aggregate through `allErrors()`, this remains the
   * original field, form, or array that produced the error rather than the observing ancestor.
   *
   * ```ts
   * const node = field('Ada');
   * const error = {
   *   kind: 'unavailable',
   *   targetNode: node,
   * };
   * error.targetNode === node; // true
   * ```
   */
  readonly targetNode: TNode;
  /**
   * Concrete control binding that produced this error, when the error is binding-specific.
   *
   * **Default:** `undefined`; ordinary validator errors are not tied to a particular binding.
   *
   * ```ts
   * const node = field('', [required]);
   * node.errors()[0]?.formNode; // undefined
   * ```
   */
  readonly formNode?: FormNodeBinding;
};

/**
 * An error that may already define its target node.
 *
 * **Default:** `undefined`; the validation pipeline supplies the current node as the target.
 *
 * ```ts
 * const node = field('Ada');
 * const error = {
 *   kind: 'unavailable',
 *   targetNode: node,
 * };
 * error.targetNode === node; // true
 * ```
 */
export type ValidationErrorWithOptionalTargetNode<TNode = unknown> = ValidationError & {
  /**
   * Node whose validation state should own this error, when explicitly provided.
   *
   * Validators may omit it to target the node currently being validated. The validation
   * pipeline then assigns that node before exposing the error through `errors()` or
   * `allErrors()`.
   *
   * **Default:** `undefined`; the validation pipeline supplies the current node as the target.
   *
   * ```ts
   * const node = field('Ada');
   * const error = {
   *   kind: 'unavailable',
   *   targetNode: node,
   * };
   * error.targetNode === node; // true
   * ```
   */
  readonly targetNode?: TNode;
  /**
   * Concrete control binding that produced this error, when the error is binding-specific.
   *
   * **Default:** `undefined`; ordinary validator errors are not tied to a particular binding.
   *
   * ```ts
   * const node = field('', [required]);
   * node.errors()[0]?.formNode; // undefined
   * ```
   */
  readonly formNode?: FormNodeBinding;
};

/**
 * An error returned by a field validator before its target node is assigned.
 *
 * ```ts
 * const error: ValidationError = {
 *   kind: 'unavailable',
 *   message: 'Try another name.',
 * };
 * error.kind; // 'unavailable'
 * ```
 */
export type ValidationErrorWithoutTargetNode = ValidationError & {
  readonly targetNode?: never;
  readonly formNode?: never;
};

/**
 * An error returned by a validator, optionally assigned to another node.
 *
 * ```ts
 * const error: ValidatorError = {
 *   kind: 'unavailable',
 *   message: 'Try another name.',
 * };
 * error.kind; // 'unavailable'
 * ```
 */
export type ValidatorError<TNode extends ValidatorNodeView<AnyNode> = ValidatorNodeView<AnyNode>> = Omit<ValidationError, 'kind'> & {
  /**
   * Error identifier. Numeric inputs are normalized with String(kind); exposed errors always use strings.
   *
   * ```ts
   * const error: ValidatorError = {
   *   kind: 'unavailable',
   *   message: 'Try another name.',
   * };
   * error.kind; // 'unavailable'
   * ```
   */
  readonly kind: string | number;
  /**
   * Node that should own this error.
   *
   * Omit this property to target the node currently being validated. Set it for cross-field or
   * aggregate validation whose error should be displayed by a specific descendant.
   *
   * **Default:** `undefined`; the validation pipeline supplies the current node as the target.
   *
   * ```ts
   * const node = field('Ada');
   * const error = {
   *   kind: 'unavailable',
   *   targetNode: node,
   * };
   * error.targetNode === node; // true
   * ```
   */
  readonly targetNode?: TNode;
  readonly formNode?: never;
};

/**
 * Indicates that validation completed without errors.
 *
 * ```ts
 * const rule = validator<string | null>(
 *   ({ value }) => {
 *     return value() ? null : 'Enter a value.';
 *   },
 * );
 * const node = field('', [rule]);
 * node.getError('custom')?.message;
 * // 'Enter a value.'
 * ```
 */
export type ValidationSuccess = null | undefined | void;

/**
 * A successful result, an error or message, or several errors and messages. Strings become errors with kind 'custom', including empty strings. Numeric error kinds are normalized to strings.
 *
 * ```ts
 * const rule = validator<string | null>(
 *   ({ value }) => {
 *     return value() ? null : 'Enter a value.';
 *   },
 * );
 * const node = field('', [rule]);
 * node.getError('custom')?.message;
 * // 'Enter a value.'
 * ```
 */
export type ValidationResult =
  | ValidationSuccess
  | string
  | ValidatorError
  | readonly (string | ValidatorError)[];

/**
 * Reactive context available to validation functions for the current field.
 *
 * ```ts
 * field('', {
 *   validators: ({ value }) => {
 *     console.log(value());
 *     return null;
 *   },
 * });
 * ```
 */
export type FieldContext<TValue> = {
  /**
   * Current value of the node being validated. Reading it creates a reactive dependency.
   *
   * ```ts
   * field('', {
   *   validators: ({ value }) => {
   *     console.log(value());
   *     return null;
   *   },
   * });
   * ```
   */
  readonly value: Signal<TValue>;
};

/** Non-validation state available through the validated node API. */
export type AsyncValidatorState = {
  /**
   * Whether this node or an ancestor form is currently running its submission action.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.submitting(); // false
   * ```
   */
  readonly submitting: Signal<boolean>;
  /**
   * Whether this node has been marked as interacted with.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.touched(); // false
   * ```
   */
  readonly touched: Signal<boolean>;
  /**
   * Logical inverse of `touched()`; true until this node is marked as touched.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.untouched(); // true
   * ```
   */
  readonly untouched: Signal<boolean>;
  /**
   * Whether user interaction or `markAsDirty()` has recorded this node as modified.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.dirty(); // false
   * ```
   */
  readonly dirty: Signal<boolean>;
  /**
   * Logical inverse of `dirty()`; true while the node does not report user modification.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.pristine(); // true
   * ```
   */
  readonly pristine: Signal<boolean>;
  /**
   * Whether local or inherited disabled state suppresses this node's own validation.
   * The node value remains present in its parent aggregate.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.disabled(); // false
   * ```
   */
  readonly disabled: Signal<boolean>;
  /**
   * Active reasons that currently make this node disabled.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.disable('Locked');
   * node.disabledReasons()[0]?.message;
   * // 'Locked'
   * ```
   */
  readonly disabledReasons: Signal<readonly DisabledReason[]>;
  /**
   * Logical inverse of `disabled()`; true while the node participates normally.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.enabled(); // true
   * ```
   */
  readonly enabled: Signal<boolean>;
  /**
   * Whether consumers should prevent the user from editing this node.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.readonly(); // false
   * ```
   */
  readonly readonly: Signal<boolean>;
  /**
   * Logical inverse of `readonly()`; true while the node may be edited.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.writable(); // true
   * ```
   */
  readonly writable: Signal<boolean>;
  /**
   * Whether consumers should omit this node from the visible UI.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.hidden(); // false
   * ```
   */
  readonly hidden: Signal<boolean>;
  /**
   * Logical inverse of `hidden()`; true while the node should be displayed.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.visible(); // true
   * ```
   */
  readonly visible: Signal<boolean>;
  /**
   * Whether the current validation rules require this node to contain a value.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.required(); // false
   * ```
   */
  readonly required: Signal<boolean>;
};

/** Callable form API when the declaration's child keys are not known. */
type ValidatorForm = Signal<any> & HiddenFunctionMembers & FormApi<any> & { $api: CallableNodeApi<FormApi<any>> };

/** Callable group API when the declaration's child keys are not known. */
type ValidatorGroup = Signal<any> & HiddenFunctionMembers & GroupApi<any> & { $api: CallableNodeApi<GroupApi<any>> };

type UntypedValidatorNode = FieldNode<any> | ValidatorForm | ValidatorGroup | ArrayNode<DynamicNode>;

/** Preserves each primitive's members while specializing its committed-value access paths. */
type ValidatorValueNode<TValue, TNode extends AnyNode = UntypedValidatorNode> = TNode extends UntypedValidatorNode
  ? Omit<TNode, 'value' | '$api'> & HiddenFunctionMembers<keyof TNode> & {
    (): TValue;
    value: NodeValueSignal<TValue>;
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
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
   * const node = profile.name;
   * node.form() === profile; // true
   * ```
   */
  readonly form: Signal<ValidatorForm | null>;
  /**
   * Complete structural root, including a standalone field. Common node members are available
   * directly; narrow the node kind before using primitive-specific operations.
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
   * const node = profile.name;
   * node.root() === profile; // true
   * ```
   */
  readonly root: Signal<ValidatorNode>;
  /**
   * Immediate form, group, or array parent, or `null` for a standalone node.
   * Common node members are available directly. A field can never be a parent.
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
   * const node = profile.name;
   * node.parent() === profile; // true
   * ```
   */
  readonly parent: Signal<ValidatorForm | ValidatorGroup | ArrayNode<DynamicNode> | null>;
  /**
   * Property names and array indexes locating the node from its root.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.path(); // ['name']
   * ```
   */
  readonly path: Signal<readonly string[]>;
  /**
   * Current exposed value of the validated node, after configured equality.
   * Signal reads participate in validation dependency tracking.
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
   * const node = profile.name;
   * node(); // 'Ada'
   * ```
   */
  readonly value: Signal<TValue>;
  /**
   * Own validation errors by default; pass `{ descendants: true }` to include descendants.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * node.errors().map(error => error.kind);
   * // ['blocked']
   * ```
   */
  readonly errors: NodeErrorsSignal;
  /**
   * Errors owned by this node and every descendant.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * node.allErrors().map(error => error.kind);
   * // ['blocked']
   * ```
   */
  readonly allErrors: Signal<readonly ValidationError[]>;
  /**
   * Whether this node and its descendants have no active errors or unresolved validation.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.valid(); // true
   * ```
   */
  readonly valid: Signal<boolean>;
  /**
   * Whether this node or a descendant currently contributes an error. False while unknown.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.invalid(); // false
   * ```
   */
  readonly invalid: Signal<boolean>;
  /**
   * Whether asynchronous validation is running on this node or a descendant.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.pending(); // false
   * ```
   */
  readonly pending: Signal<boolean>;
  /**
   * Whether a control-originated value is waiting to be committed on this node or a descendant.
   * This is separate from the debounce option of an asynchronous validator.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.debouncing(); // false
   * ```
   */
  readonly debouncing: Signal<boolean>;
  /**
   * Current aggregate result: valid, invalid, or unknown while validation is unresolved.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.validationStatus(); // 'valid'
   * ```
   */
  readonly validationStatus: Signal<ValidationStatus>;
  /**
   * Returns this node's first direct error with `kind`, or `undefined` when none exists.
   *
   * ```ts
   * const node = field('', [required]);
   * node.getError('required')?.kind;
   * // 'required'
   * ```
   *
   * @reactive Reads the current direct-error collection on every call.
   */
  getError<TKind extends string>(kind: TKind): ValidationErrorForKind<TKind> | undefined;
  /**
   * Replaces the node's committed value and triggers the corresponding state and validation updates.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.set('Lia');
   * node(); // 'Lia'
   * ```
   */
  set(value: TValue): void;
  /**
   * Replaces the value with the result of applying `updater` to its current exposed value.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.update(() => 'Lia');
   * node(); // 'Lia'
   * ```
   */
  update(updater: (value: TValue) => TValue): void;
  /**
   * Commits any buffered control value immediately and runs validation that was waiting for it.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada', { debounce: 'blur' }),
   * });
   * profile.name.value.control.set('Lia');
   * profile.name.flush();
   * profile.name(); // 'Lia'
   * ```
   */
  flush(): void;
  /**
   * Clears interaction state; preserves the current value unless a replacement is provided.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.set('Lia');
   * node.markAsDirty();
   * node.reset();
   * node(); // 'Lia'
   * node.dirty(); // false
   * ```
   */
  reset(...args: [] | [value: TValue]): void;
  /**
   * Marks this node and, unless skipped, its interactive descendants as touched and commits their
   * pending control values for every debounce strategy.
   *
   * This can change committed values and trigger validation and value-change callbacks,
   * even when nodes are already touched. Noninteractive subtrees ignore this operation.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.markAsTouched();
   * node.touched(); // true
   * ```
   */
  markAsTouched(options?: {
    /**
     * Skips recursively touching and committing descendants; the validated node still commits its own pending input.
     *
     * ```ts
     * const profile = form({
     *   name: field('Ada'),
     * });
     * const node = profile.name;
     * node.markAsTouched();
     * node.touched(); // true
     * ```
     */
    skipDescendants?: boolean;
  }): void;
  /**
   * Clears this node's own touched marker without changing descendant markers or values.
   * An interactive touched descendant can keep an aggregate `touched()` true. Use `reset()`
   * to clear interaction state throughout the subtree.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.markAsTouched();
   * node.markAsUntouched();
   * node.touched(); // false
   * ```
   */
  markAsUntouched(): void;
  /**
   * Marks this node as dirty without changing its value.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.markAsDirty();
   * node.dirty(); // true
   * ```
   */
  markAsDirty(): void;
  /**
   * Clears stored dirty state without changing the current value.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.markAsDirty();
   * node.markAsPristine();
   * node.dirty(); // false
   * ```
   */
  markAsPristine(): void;
  /**
   * Adds an imperative disabled reason and suppresses this node's own validation.
   * Values remain readable, writable programmatically, and present in parent aggregates.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.disable('Locked');
   * node.disabled(); // true
   * ```
   */
  disable(message?: string): void;
  /**
   * Clears local disabled state, including a static initial `disabled` option. Continuing
   * reactive conditions and inherited reasons remain effective, so `enabled()` may stay false.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.disable();
   * node.enable();
   * node.disabled(); // false
   * ```
   */
  enable(): void;
  /**
   * Adds the imperative readonly state, making `readonly()` true.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.markAsReadonly();
   * node.readonly(); // true
   * ```
   */
  markAsReadonly(): void;
  /**
   * Clears local readonly state, including a static initial `readonly` option. Reactive
   * conditions and ancestor readonly state can still prevent the node from becoming writable.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.markAsReadonly();
   * node.markAsWritable();
   * node.readonly(); // false
   * ```
   */
  markAsWritable(): void;
  /**
   * Adds the imperative hidden state, making `visible()` false.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.hide();
   * node.hidden(); // true
   * ```
   */
  hide(): void;
  /**
   * Clears local hidden state, including a static initial `hidden` option. Reactive
   * conditions and ancestor hidden state can still keep the node hidden.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const node = profile.name;
   * node.hide();
   * node.show();
   * node.hidden(); // false
   * ```
   */
  show(): void;
};

/**
 * Default owner API shape used to specialize asynchronous validator contexts.
 * The context exposes a readonly validation view; its node cannot be mutated through that view.
 */
export type AsyncValidatorApi<TValue> = ValidatorApi<TValue>;

/**
 * Reactive value and navigation shared by all validator context specializations.
 *
 * ```ts
 * field('', {
 *   validators: ({ value }) => {
 *     console.log(value());
 *     return null;
 *   },
 * });
 * ```
 */
export type ValidatorReadonlyApi<TValue> = FieldContext<TValue> & {
  /**
   * Immediate parent inferred by a specialized validator API.
   *
   * ```ts
   * field('', {
   *   validators: ({ parent }) => {
   *     console.log(parent()?.$api.path());
   *     return null;
   *   },
   * });
   * ```
   */
  readonly parent: Signal<any>;
  /**
   * Property names and array indexes locating the validated node from its root.
   *
   * ```ts
   * field('', {
   *   validators: ({ path }) => {
   *     console.log(path());
   *     return null;
   *   },
   * });
   * ```
   */
  readonly path: Signal<readonly string[]>;
};

type ValidatorRootSignal<TNode> = TNode extends { $api: { root: Signal<infer TRoot> } } ? Signal<ValidatorNodeView<TRoot>> : never;

/**
 * Reactive context provided to synchronous validators.
 * Generic public owners retain TValue on their node value reads. Concrete owners and partial
 * structural owner contracts retain their value and child types through a read-only validation
 * view. Validation outputs, metadata queries, and mutations are omitted recursively.
 *
 * ```ts
 * field('', {
 *   validators: ({ value }) => {
 *     console.log(value());
 *     return null;
 *   },
 * });
 * ```
 */
export type ValidatorContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = ValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = Pick<TApi, 'path'> & {
  /**
   * Reactive structural root, identical to `ctx.node().$api.root()`.
   * Returns the validated node itself when standalone and follows attachment and detachment.
   * The returned node retains the same read-only validation view as node navigation.
   *
   * ```ts
   * field('', {
   *   validators: ({ root }) => {
   *     console.log(root().$api.path());
   *     return null;
   *   },
   * });
   * ```
   */
  readonly root: ValidatorRootSignal<ValidatorNode extends TField ? 'nodeType' extends keyof TField ? ValidatorNode<TValue> : TField : TField>;
  /**
   * Reactive immediate parent, or null before attachment and after detachment.
   * Supply a parent node type to declare a structural contract: `ctx.parent<RoleNode>()`.
   * Indexed row types may include null or undefined: `ctx.parent<PageForm['roles'][number]>()`.
   * The generic removes those nullish members; the result is the read-only node view or null, never undefined.
   * This is a type assertion, not inference or runtime validation; null and the read-only
   * validation view are always preserved, including when an explicit generic is supplied.
   * Prefer configure option callbacks for inferred sibling access without an assertion.
   *
   * ```ts
   * field('', {
   *   validators: ({ parent }) => {
   *     console.log(parent()?.$api.path());
   *     return null;
   *   },
   * });
   * ```
   */
  readonly parent: Pick<TApi['parent'], keyof TApi['parent']> & {
    <TParent extends { $api: { nodeType(): 'form' | 'group' | 'array' } } | null | undefined = NonNullable<ReturnType<TApi['parent']>>>(): ValidatorNodeView<NonNullable<TParent>> | null;
    (): ValidatorNodeView<ReturnType<TApi['parent']>>;
  };
  /**
   * Current exposed value of the validated node, after configured equality.
   * Signal reads participate in validation dependency tracking.
   *
   * ```ts
   * field('', {
   *   validators: ({ value }) => {
   *     console.log(value());
   *     return null;
   *   },
   * });
   * ```
   */
  readonly value: ValidatorNode extends TField ? TApi['value'] : ValidatorValueSignal<ReturnType<TField['$api']['value']>>;
  /**
   * Readonly signal of the node being validated, with validation outputs and mutations omitted
   * recursively from its type, including navigation and child access.
   * `ctx.node()` and `ctx.field()` return the same node. Read its value with `ctx.value()`.
   *
   * ```ts
   * field('', {
   *   validators: ({ field }) => {
   *     console.log(field().$api.path());
   *     return null;
   *   },
   * });
   * ```
   */
  readonly field: Signal<ValidatorNodeView<ValidatorNode extends TField ? 'nodeType' extends keyof TField ? ValidatorNode<TValue> : TField : TField>>;
  /**
   * Readonly signal of the node being validated, with validation outputs and mutations omitted
   * recursively from its type, including navigation and child access.
   * `ctx.node()` and `ctx.field()` return the same node. Read its value with `ctx.value()`.
   *
   * ```ts
   * field('', {
   *   validators: ({ node }) => {
   *     console.log(node().$api.path());
   *     return null;
   *   },
   * });
   * ```
   */
  readonly node: Signal<ValidatorNodeView<ValidatorNode extends TField ? 'nodeType' extends keyof TField ? ValidatorNode<TValue> : TField : TField>>;
};

/**
 * Reactive context shared by asynchronous validator conditions, params, and handlers.
 *
 * ```ts
 * field('', {
 *   validators: ({ value }) => {
 *     console.log(value());
 *     return null;
 *   },
 * });
 * ```
 */
export type AsyncValidatorBaseContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = ValidatorContext<TValue, TApi, TField>;

/**
 * Aggregate result of validation; it does not describe the node's value type.
 *
 * **Accepted values:**
 *
 * - `valid`: No errors and no unresolved asynchronous validation.
 * - `invalid`: At least one own or descendant error, even if other work is pending.
 * - `unknown`: No errors yet, but asynchronous validation is pending (including its delay).
 *
 * ```ts
 * const node = field('', [required]);
 * node.validationStatus(); // 'invalid'
 * ```
 */
export type ValidationStatus = 'valid' | 'invalid' | 'unknown';

/**
 * Reactive node context and cancellation signal provided to an asynchronous validator run.
 *
 * ```ts
 * field('', {
 *   validators: asyncValidator(
 *     async ({ abortSignal }) => {
 *       await Promise.resolve();
 *       if (abortSignal.aborted) return null;
 *       return null;
 *     },
 *   ),
 * });
 * ```
 */
export type AsyncValidatorContext<TValue, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = AsyncValidatorBaseContext<TValue, TApi, TField> & {
  /**
   * Cancellation signal for this execution.
   *
   * It aborts when a newer execution supersedes this one or the validator is deactivated. Pass it
   * to APIs such as `fetch()` so obsolete work stops promptly; stale results are ignored anyway.
   *
   * ```ts
   * field('', {
   *   validators: asyncValidator(
   *     async ({ abortSignal }) => {
   *       await Promise.resolve();
   *       if (abortSignal.aborted) return null;
   *       return null;
   *     },
   *   ),
   * });
   * ```
   */
  readonly abortSignal: AbortSignal;
};

/**
 * Asynchronous validator context extended with the current reactive parameter snapshot.
 *
 * ```ts
 * field('', {
 *   validators: asyncValidator({
 *     params: ({ value }) => value(),
 *     validate: async ({ params }) => {
 *       return params === 'reserved'
 *         ? { kind: 'unavailable' }
 *         : null;
 *     },
 *   }),
 * });
 * ```
 */
export type ParameterizedAsyncValidatorContext<TValue, TParams, TApi extends ValidatorReadonlyApi<TValue> = AsyncValidatorApi<TValue>, TField extends AnyNode = ValidatorNode> = AsyncValidatorContext<TValue, TApi, TField> & {
  /**
   * Snapshot returned by the validator's reactive `params` function.
   *
   * ```ts
   * field('', {
   *   validators: asyncValidator({
   *     params: ({ value }) => value(),
   *     validate: async ({ params }) => {
   *       return params === 'reserved'
   *         ? { kind: 'unavailable' }
   *         : null;
   *     },
   *   }),
   * });
   * ```
   */
  readonly params: TParams;
};

/**
 * Promise-like or observable-like result accepted from an asynchronous validator.
 *
 * ```ts
 * field('', {
 *   validators: asyncValidator(async () => {
 *     await Promise.resolve();
 *     return { kind: 'unavailable' };
 *   }),
 * });
 * ```
 */
export type AsyncValidationResult = PromiseLike<ValidationResult> | ObservableLike<ValidationResult>;

/**
 * Synchronous validator receiving the current value as a reactive signal.
 *
 * ```ts
 * const rule: Validator<string | null> = ({
 *   value,
 * }) => {
 *   return value() ? null : { kind: 'empty' };
 * };
 * const node = field('', [rule]);
 * node.hasError('empty'); // true
 * ```
 */
export type Validator<TValue> = (context: FieldContext<TValue>) => ValidationResult;

/** Resolves an unspecified helper owner to the common public node API while preserving reuse. */
export type ValidatorOwner<TNode extends AnyNode> = AnyNode extends TNode ? ValidatorNode : TNode;

/**
 * Validator marked by `asyncValidator()` for asynchronous scheduling and cancellation.
 *
 * ```ts
 * field('', {
 *   validators: asyncValidator(async () => {
 *     await Promise.resolve();
 *     return { kind: 'unavailable' };
 *   }),
 * });
 * ```
 */
export type AsyncValidator<TValue, TField extends AnyNode = AnyNode> = (context: ValidatorContext<TValue, ValidatorApi<TValue>, TField>) => ValidationResult;

/**
 * Validator that may return errors directly or compose one or more validators dynamically.
 *
 * ```ts
 * const rule = validator<string | null>(
 *   ({ value }) => {
 *     return value() ? null : [required];
 *   },
 * );
 * const node = field('', [rule]);
 * node.hasError('required'); // true
 * ```
 */
export type ComposableValidator<TValue, TField extends AnyNode = ValidatorNode> = (context: ValidatorContext<TValue, ValidatorApi<TValue>, TField>) => ComposableValidationResult<TValue, TField>;

/**
 * Result accepted from a composable validator, including nested validators and successful entries.
 *
 * ```ts
 * const rule = validator<string | null>(
 *   ({ value }) => {
 *     return value() ? null : [required];
 *   },
 * );
 * const node = field('', [rule]);
 * node.hasError('required'); // true
 * ```
 */
export type ComposableValidationResult<TValue, TField extends AnyNode = ValidatorNode> =
  | ValidationResult
  | Validator<TValue>
  | ComposableValidator<TValue, TField>
  | readonly (ComposableValidator<TValue, TField> | ValidationSuccess)[];

/**
 * Readonly normalized collection of composable validators for a node value.
 *
 * ```ts
 * const rule = validator<string | null>(
 *   ({ value }) => {
 *     return value() ? null : [required];
 *   },
 * );
 * const node = field('', [rule]);
 * node.hasError('required'); // true
 * ```
 */
export type Validators<TValue, TField extends AnyNode = ValidatorNode> = readonly ComposableValidator<TValue, TField>[];

// A shared first branch keeps contextual return typing stable across repeated instantiations.
export type DeferredValidator = () => any;

/** Shared unchecked branch for parameterless conditions in contextual and overloaded signatures. */
export type DeferredCondition = () => any;

/** Typed declaration context with an unchecked return to avoid circular initializer inference. */
type DeclarationValidator<TValue, TField extends AnyNode> = (context: ValidatorContext<TValue, ValidatorApi<TValue>, TField>) => any;

/**
 * One validator or a readonly list in which null and undefined represent no validator.
 *
 * The callback context and owning node remain fully typed. **Declaration callback returns are
 * intentionally typed as any** so they can read their initializing form or group without a
 * circular-inference error. This does not expand the supported runtime results.
 *
 * Return a {@link ValidationResult}: null/undefined/implicit fallthrough for success, a message
 * string, an error with a string or numeric kind, or an array of messages/errors. Numeric kinds
 * become strings. For synchronous composition, return another validator or a validator array;
 * {@link ComposableValidationResult} describes this complete contract. Do not mix validators
 * and errors in one returned array or return an unmarked Promise; use asyncValidator() for async work.
 *
 * Annotate a callback's return as ValidationResult or ComposableValidationResult to check it.
 * The context-taking validator() helper also checks returns and preserves contextual typing
 * for returned inline validators. Checked callbacks can still need an explicit result annotation
 * when they reference their own initializer. Parameterless helper callbacks remain unchecked.
 *
 * ```ts
 * const rule = validator<string | null>(
 *   ({ value }) => {
 *     return value() ? null : [required];
 *   },
 * );
 * const node = field('', [rule]);
 * node.hasError('required'); // true
 * ```
 */
export type ValidatorSource<TValue, TField extends AnyNode = ValidatorNode> =
  | DeclarationValidator<TValue, TField>
  | DeferredValidator
  // Tuple contextual typing avoids comparing a deferred callback's return with sibling entries.
  | readonly [
    validator?: DeferredValidator | DeclarationValidator<TValue, TField> | ValidationSuccess,
    ...validators: (DeferredValidator | DeclarationValidator<TValue, TField> | ValidationSuccess)[]
  ];
