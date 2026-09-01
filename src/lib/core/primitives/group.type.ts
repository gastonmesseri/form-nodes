import type { Signal } from '@angular/core';

import type { FormApi, FormOptions, FormPatch, FormSet, FormValue, NodeWithParent } from './form.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';
import type { CustomValidationError, ValidationError, ValidationErrorMap } from '../validation/validation.type';
import type { Node, NodeDefinitions, Nodes, RootNode } from '../types/node.type';

/** Configuration shared by object-shaped groups, excluding form submission behavior. */
export type GroupOptions<TValue = any> = Omit<FormOptions<TValue>, 'submission'>;

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
