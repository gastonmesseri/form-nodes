import type { Signal } from '@angular/core';

import type { AnyNode } from './node.type';
import type { FormApi } from '../primitives/form.type';
import type { GroupApi } from '../primitives/group.type';
import type { CallableNodeApi } from './callable-node-api.type';
import type { ValidationErrorWithTargetNode, ValidationErrorMap, CustomValidationError, ValidatorSource } from '../validation/validation.type';

type UnknownChildrenMembers = 'children' | 'forEachChild' | 'add';
type UnknownChildrenApi = {
  readonly children: Readonly<Record<string, AnyNode>>;
  /** @reactive Tracks structure changes and reactive reads performed by the callback. */
  forEachChild(callback: (child: AnyNode, key: string) => void, options?: { includeDynamic?: boolean }): void;
};
type GenericOwnerApi<TNode extends AnyNode> = {
  root: Signal<AnyNode>;
  errors: Signal<readonly ValidationErrorWithTargetNode<TNode>[]>;
  setValidators(validators: ValidatorSource<any, TNode>): void;
  /** @reactive Tracks and memoizes this node's own error for the requested kind. */
  getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationErrorWithTargetNode<TNode> & ValidationErrorMap[TKind]) | undefined;
  /** @reactive Tracks and memoizes this node's own custom error for the requested kind. */
  getError<TKind extends string>(kind: TKind): (ValidationErrorWithTargetNode<TNode> & CustomValidationError<TKind>) | undefined;
};
type GenericFormApi = Omit<FormApi<any>, UnknownChildrenMembers | keyof GenericOwnerApi<GenericFormNode>> & Pick<FormApi<{}>, 'add'> & UnknownChildrenApi & GenericOwnerApi<GenericFormNode>;
type GenericGroupApi = Omit<GroupApi<any>, UnknownChildrenMembers | keyof GenericOwnerApi<GenericGroupNode>> & Pick<GroupApi<{}>, 'add'> & UnknownChildrenApi & GenericOwnerApi<GenericGroupNode>;

/**
 * A form node with unspecified children. Use `$api` for form operations because child names may
 * collide with direct members. Use `FormNode<TChildren>` when the child structure is known.
 */
export type GenericFormNode = Signal<any> & { (): any; $api: CallableNodeApi<GenericFormApi> };

/**
 * A group node with unspecified children. Use `$api` for group operations because child names may
 * collide with direct members. Use `GroupNode<TChildren>` when the child structure is known.
 */
export type GenericGroupNode = Signal<any> & { (): any; $api: CallableNodeApi<GenericGroupApi> };

