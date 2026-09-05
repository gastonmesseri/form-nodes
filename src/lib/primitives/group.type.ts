import type { Signal } from '@angular/core';

import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { DynamicNode, NearestForm, Node, Nodes, NodeValue, RootNode } from '../types/node.type';
import type { CustomValidationError, ValidationError, ValidationErrorMap, ValidationStatus, ValidatorSource } from '../validation/validation.type';
import type { AddedNode, DynamicFormChildren, FormApi, FormOptions, FormPatch, FormSet, FormValue, NodeWithParent, NormalizedNode as FormNormalizedNode, NormalizedNodes as FormNormalizedNodes, ObjectNodeDefinition, ObjectNodeDefinitionInput, ObjectNodeDefinitionInputs, ObjectNodeDefinitions } from './form.type';

/** Configuration shared by object-shaped groups, excluding form submission behavior. */
export type GroupOptions<TValue = any, TGroup extends Node = Group<any>> = Omit<FormOptions<TValue>, 'onSubmit' | 'onSubmitBlocked' | 'submitWhen' | 'validators' | 'debounce' | 'hidden' | 'disabled' | 'readonly'> & {
  /**
   * One validator or an array of validators for the complete group value.
   *
   * @example Start with a named reusable validator.
   * ```ts
   * group({
   *   start: field<Date>(),
   *   end: field<Date>(),
   * }, {
   *   validators: validDateRange,
   * });
   * ```
   *
   * @example Declare a small group rule inline.
   * ```ts
   * group({
   *   city: field(''),
   *   country: field(''),
   * }, {
   *   validators: [({ value }) => value().city || value().country
   *     ? null
   *     : { kind: 'emptyAddress', message: 'Enter a city or country.' }],
   * });
   * ```
   *
   * @example Add one asynchronous group validator.
   * ```ts
   * group({
   *   city: field(''),
   *   country: field(''),
   * }, {
   *   validators: asyncValidator(async ({ value }) => {
   *     const supported = await isAddressSupported(value());
   *     return supported ? null : { kind: 'unsupportedAddress' };
   *   }),
   * });
   * ```
   *
   * Use child validators for rules that belong to one field; use group validators for rules that
   * consider the object boundary as a whole.
   */
  validators?: ValidatorSource<TValue, TGroup>;
  /**
   * Default control-value debounce inherited by descendants of this object branch.
   *
   * @example Give address controls a 300-millisecond debounce by default.
   * ```ts
   * group({
   *   city: field(''),
   *   country: field(''),
   * }, { debounce: 300 });
   * ```
   *
   * @example Commit address values when their controls lose focus.
   * ```ts
   * group({
   *   city: field(''),
   *   country: field(''),
   * }, { debounce: 'blur' });
   * ```
   */
  debounce?: number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);
  /**
   * Initial or reactive visibility of the complete object branch.
   *
   * @example Create an object branch that starts hidden.
   * ```ts
   * group({
   *   city: field(''),
   * }, { hidden: true });
   * ```
   *
   * @example Hide the shipping address when it matches the billing address.
   * ```ts
   * group({
   *   city: field(''),
   *   country: field(''),
   * }, {
   *   hidden: () => useBillingAddress(),
   * });
   * ```
   */
  hidden?: boolean | (() => boolean);
  /**
   * Initial or reactive disabled state for the branch and its children. Return a string to record
   * a user-facing reason.
   *
   * @example Create an object branch that starts disabled.
   * ```ts
   * group({
   *   city: field(''),
   * }, { disabled: 'This address is managed by your organization.' });
   * ```
   *
   * @example Disable an address branch when the current user cannot edit it.
   * ```ts
   * group({
   *   city: field(''),
   *   country: field(''),
   * }, {
   *   disabled: () => canEditAddress() ? false : 'You cannot edit this address.',
   * });
   * ```
   */
  disabled?: boolean | string | (() => boolean | string);
  /**
   * Initial or reactive readonly state for the branch and its children.
   *
   * @example Create an object branch that starts in readonly mode.
   * ```ts
   * group({
   *   legalName: field(''),
   * }, { readonly: true });
   * ```
   *
   * @example Keep verified identity details visible but immutable.
   * ```ts
   * group({
   *   legalName: field(''),
   *   documentNumber: field(''),
   * }, {
   *   readonly: () => identityVerified(),
   * });
   * ```
   */
  readonly?: boolean | (() => boolean);
};

/** Object value produced by a group, with each child node mapped to its readable value. */
export type GroupValue<TNodes extends Nodes> = FormValue<TNodes>;
/** Complete object accepted by a group's `set()`, recursively using each child's set type. */
export type GroupSet<TNodes extends Nodes> = FormSet<TNodes>;
/** Partial object accepted by a group's `patch()`; omitted child properties remain unchanged. */
export type GroupPatch<TNodes extends Nodes> = FormPatch<TNodes>;

export type NormalizedNode<TNode extends ObjectNodeDefinition> = FormNormalizedNode<TNode>;

export type NormalizedNodes<TNodes extends ObjectNodeDefinitions> = FormNormalizedNodes<TNodes>;

export type GroupRoot<TNodes extends Nodes, TParent extends Node> = Node extends TParent
  ? Group<TNodes, TParent>
  : RootNode<TParent>;

export type GroupChildren<TNodes extends Nodes, TParent extends Node> = {
  readonly [K in keyof TNodes]: NodeWithParent<TNodes[K], Group<TNodes, TParent>>;
};

export type GroupApi<TNodes extends Nodes, TParent extends Node = Node> =
  & Omit<FormApi<TNodes, TParent>, 'setValidators' | 'children' | 'errors' | 'allErrors' | 'form' | 'root' | 'getError' | 'add' | 'remove' | 'nodeType' | 'submit' | 'submitting' | 'validationStatus'>
  & {
    /** Returns the concrete primitive represented by this node. */
    nodeType(): 'group';
    /** Replaces this group's validators while preserving its node type in inline callbacks. */
    setValidators(validators: ValidatorSource<GroupValue<TNodes>, Group<TNodes, TParent>>): void;
    /** Stable readonly map of this group's immediate child nodes. */
    readonly children: GroupChildren<TNodes, TParent> & DynamicFormChildren;
    /**
     * Adds one child at runtime and returns the attached node with its exact inferred type.
     *
     * @example Add one named child to a group.
     * ```ts
     * const filters = group({ query: field('') });
     *
     * const category = filters.add('category', field('all'));
     * category(); // 'all'
     * filters.get('category') === category; // true
     * filters.children['category'] === category; // true
     * ```
     */
    add<TKey extends string, TDefinition>(key: TKey extends keyof TNodes | '$api' ? never : TKey, definition: ObjectNodeDefinitionInput<TDefinition>): AddedNode<TDefinition, Group<TNodes, TParent>>;
    /**
     * Adds several child definitions atomically and returns an exact keyed map of their attached
     * live nodes.
     *
     * @example Add several children to a group in one structural update.
     * ```ts
     * const filters = group({ query: field('') });
     *
     * const added = filters.add({
     *   sort: field('relevance'),
     *   range: {
     *     minimum: field(0),
     *     maximum: field(100),
     *   },
     * });
     *
     * added.sort(); // 'relevance'
     * added.range.maximum(); // 100
     * filters.get('range') === added.range; // true
     * filters.children['range'] === added.range; // true
     * ```
     */
    add<TDefinitions extends ObjectNodeDefinitions>(definitions: TDefinitions & ObjectNodeDefinitionInputs<TDefinitions> & Partial<Record<keyof TNodes | '$api', never>>): {
      readonly [TKey in keyof TDefinitions]: AddedNode<TDefinitions[TKey], Group<TNodes, TParent>>;
    };
    /** Detaches a dynamically added child. Initially declared children cannot be removed. */
    remove(key: string): DynamicNode | undefined;
    /**
     * Nearest explicit `form()` containing this group, or `null` when no form workflow owns it.
     * A nested explicit form is the workflow owner instead of the complete structural root.
     */
    form: Signal<NearestForm<TParent> | null>;
    /**
     * Complete structural root containing this group. A root or detached group returns itself.
     * Use this signal when traversal must cross nested form workflow boundaries.
     */
    root: Signal<GroupRoot<TNodes, TParent>>;
    /**
     * Validation errors belonging directly to this group, excluding descendant-owned errors.
     *
     * @example
     * ```ts
     * address.errors();
     * // [{ kind: 'unsupportedCountry', message: 'Country is unavailable.', targetNode: address }]
     * ```
     */
    errors: Signal<readonly ValidationError.WithTargetNode<Group<TNodes, TParent>>[]>;
    /**
     * Validation errors from this group and its complete subtree in structural order.
     *
     * @example
     * ```ts
     * address.allErrors();
     * // [{ kind: 'required', message: 'City is required.', targetNode: address.city }]
     * ```
     */
    allErrors: Signal<readonly ValidationError.WithTargetNode<Node>[]>;
    /**
     * Returns the first validation error belonging directly to this group and matching `kind`.
     *
     * @reactive Maintains an independent reactive computation for each `kind`.
     */
    getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationError.WithTargetNode<Group<TNodes, TParent>> & ValidationErrorMap[TKind]) | undefined;
    /**
     * Returns the first custom error belonging directly to this group and matching `kind`.
     *
     * @reactive Maintains an independent reactive computation for each `kind`.
     */
    getError<TKind extends string>(kind: TKind): (ValidationError.WithTargetNode<Group<TNodes, TParent>> & CustomValidationError<TKind>) | undefined;
    /**
     * Aggregated validation phase for this group subtree: `'valid'`, `'invalid'`, or `'unknown'`.
     *
     * `'unknown'` means asynchronous validation is pending on this group or a descendant and no
     * error is currently available in the subtree. While unknown, `pending()` is true and both
     * `valid()` and `invalid()` are false. Any available error makes the status `'invalid'`, even
     * if other validation remains pending.
     */
    validationStatus: Signal<ValidationStatus>;
    /** Whether an ancestor form is currently running its submission action. Groups cannot initiate submission. */
    submitting: Signal<boolean>;
  };

type GroupApiProperty<TNodes extends Nodes, TParent extends Node> = {
  /** Complete group API and the recommended access path for application code. */
  api: TNodes extends { api: infer TApi extends Node }
    ? NodeWithParent<TApi, Group<TNodes, TParent>>
    : GroupApi<TNodes, TParent>;
  /**
   * Collision-safe access to the group API.
   * Prefer `api` for ordinary application code; `$api` remains a supported, stable escape hatch.
   */
  $api: GroupApi<TNodes, TParent>;
};

/** An object-shaped structural node without its own submission workflow. */
export type Group<TNodes extends Nodes, TParent extends Node = Node> =
  & {
    /** Returns the group's current aggregate committed value and participates in signal dependency tracking. */
    (): { [K in keyof TNodes]: NodeValue<TNodes[K]> };
  }
  & GroupApiProperty<TNodes, TParent>
  & Omit<GroupChildren<TNodes, TParent>, 'api'>
  & Omit<GroupApi<TNodes, TParent>, keyof TNodes>
  & HiddenFunctionMembers<keyof TNodes | keyof GroupApi<TNodes, TParent>>;
