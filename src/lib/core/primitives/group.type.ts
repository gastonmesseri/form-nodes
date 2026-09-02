import type { Signal } from '@angular/core';

import type { Node, NodeDefinitions, Nodes, RootNode } from '../types/node.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { FormApi, FormOptions, FormPatch, FormSet, FormValue, NodeWithParent } from './form.type';
import type { CustomValidationError, ValidationError, ValidationErrorMap, ValidatorSource } from '../validation/validation.type';

/** Configuration shared by object-shaped groups, excluding form submission behavior. */
export type GroupOptions<TValue = any> = Omit<FormOptions<TValue>, 'submission' | 'validators' | 'hidden' | 'disabled' | 'readonly'> & {
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
  validators?: ValidatorSource<TValue>;
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

export type GroupValue<TNodes extends Nodes> = FormValue<TNodes>;
export type GroupSet<TNodes extends Nodes> = FormSet<TNodes>;
export type GroupPatch<TNodes extends Nodes> = FormPatch<TNodes>;

export type NormalizedNode<TNode extends Node | NodeDefinitions> =
  TNode extends Node ? TNode
    : TNode extends NodeDefinitions ? Group<NormalizedNodes<TNode>> : Node;

export type NormalizedNodes<TNodes extends NodeDefinitions> = {
  [K in keyof TNodes]: NormalizedNode<TNodes[K]>;
};

export type GroupRoot<TNodes extends Nodes, TParent extends Node> = Node extends TParent
  ? Group<TNodes, TParent>
  : RootNode<TParent>;

export type GroupChildren<TNodes extends Nodes, TParent extends Node> = {
  readonly [K in keyof TNodes]: NodeWithParent<TNodes[K], Group<TNodes, TParent>>;
};

export type GroupApi<TNodes extends Nodes, TParent extends Node = Node> =
  & Omit<FormApi<TNodes, TParent>, 'children' | 'errors' | 'allErrors' | 'form' | 'getError' | 'submit' | 'submitting'>
  & {
    readonly children: GroupChildren<TNodes, TParent>;
    form: Signal<GroupRoot<TNodes, TParent>>;
    errors: Signal<readonly ValidationError.WithTargetNode<Group<TNodes, TParent>>[]>;
    allErrors: Signal<readonly ValidationError.WithTargetNode<Node>[]>;
    getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationError.WithTargetNode<Group<TNodes, TParent>> & ValidationErrorMap[TKind]) | undefined;
    getError<TKind extends string>(kind: TKind): (ValidationError.WithTargetNode<Group<TNodes, TParent>> & CustomValidationError<TKind>) | undefined;
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
   *
   * @deprecated Not actually deprecated. Prefer `api` unless collision-safe access is required.
   */
  $api: GroupApi<TNodes, TParent>;
};

/** A fixed, object-shaped structural node without its own submission workflow. */
export type Group<TNodes extends Nodes, TParent extends Node = Node> =
  & { (): GroupValue<TNodes> }
  & GroupApiProperty<TNodes, TParent>
  & Omit<GroupChildren<TNodes, TParent>, 'api'>
  & Omit<GroupApi<TNodes, TParent>, keyof TNodes>
  & HiddenFunctionMembers<keyof TNodes | keyof GroupApi<TNodes, TParent>>;
