import type { Signal } from '@angular/core';

import type { AnyNode } from './node.type';
import type { FormApi } from '../primitives/form.type';
import type { GroupApi } from '../primitives/group.type';
import type { ArrayApi } from '../primitives/array.type';
import type { FieldNode } from '../primitives/field.type';
import type { HiddenFunctionMembers } from './hidden-function-members.type';
import type { ValidationErrorWithTargetNode, ValidationErrorMap, CustomValidationError, ValidatorSource } from '../validation/validation.type';

/** A field node with an unspecified value type. Use `FieldNode<TValue>` when the value type is known. */
export type AnyFieldNode = FieldNode<any>;

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
type AnyFormApi = Omit<FormApi<any>, UnknownChildrenMembers | keyof GenericOwnerApi<AnyFormNode>> & Pick<FormApi<{}>, 'add'> & UnknownChildrenApi & GenericOwnerApi<AnyFormNode>;
type AnyGroupApi = Omit<GroupApi<any>, UnknownChildrenMembers | keyof GenericOwnerApi<AnyGroupNode>> & Pick<GroupApi<{}>, 'add'> & UnknownChildrenApi & GenericOwnerApi<AnyGroupNode>;

/**
 * A form node with unspecified children. Use `$api` for form operations because child names may
 * collide with direct members. Use `FormNode<TChildren>` when the child structure is known.
 */
export type AnyFormNode = AnyNode & { $api: AnyFormApi };

/**
 * A group node with unspecified children. Use `$api` for group operations because child names may
 * collide with direct members. Use `GroupNode<TChildren>` when the child structure is known.
 */
export type AnyGroupNode = AnyNode & { $api: AnyGroupApi };

type AnyArrayApi = Omit<ArrayApi<AnyNode>, 'root' | 'forEach' | 'map' | 'filter' | 'find' | 'findIndex' | 'some' | 'every' | 'errors' | 'getError' | 'setValidators'> & {
  root: Signal<AnyNode>;
  errors: Signal<readonly ValidationErrorWithTargetNode<AnyArrayNode>[]>;
  setValidators(validators: ValidatorSource<any[], AnyArrayNode>): void;
  /** @reactive Tracks and memoizes this node's own error for the requested kind. */
  getError<TKind extends keyof ValidationErrorMap>(kind: TKind): (ValidationErrorWithTargetNode<AnyArrayNode> & ValidationErrorMap[TKind]) | undefined;
  /** @reactive Tracks and memoizes this node's own custom error for the requested kind. */
  getError<TKind extends string>(kind: TKind): (ValidationErrorWithTargetNode<AnyArrayNode> & CustomValidationError<TKind>) | undefined;
  /** @reactive Tracks item structure and reactive reads performed by the callback. */
  forEach(callback: (item: AnyNode, index: number, array: AnyArrayNode) => void): void;
  /** @reactive Tracks item structure and reactive reads performed by the callback. */
  map<TResult>(callback: (item: AnyNode, index: number, array: AnyArrayNode) => TResult): TResult[];
  /** @reactive Tracks item structure and reactive reads performed by the callback. */
  filter<TFiltered extends AnyNode>(predicate: (item: AnyNode, index: number, array: AnyArrayNode) => item is TFiltered): TFiltered[];
  /** @reactive Tracks item structure and reactive reads performed by the callback. */
  filter(predicate: (item: AnyNode, index: number, array: AnyArrayNode) => unknown): AnyNode[];
  /** @reactive Tracks item structure and reactive reads performed by the callback. */
  find<TFound extends AnyNode>(predicate: (item: AnyNode, index: number, array: AnyArrayNode) => item is TFound): TFound | undefined;
  /** @reactive Tracks item structure and reactive reads performed by the callback. */
  find(predicate: (item: AnyNode, index: number, array: AnyArrayNode) => unknown): AnyNode | undefined;
  /** @reactive Tracks item structure and reactive reads performed by the callback. */
  findIndex(predicate: (item: AnyNode, index: number, array: AnyArrayNode) => unknown): number;
  /** @reactive Tracks item structure and reactive reads performed by the callback. */
  some(predicate: (item: AnyNode, index: number, array: AnyArrayNode) => unknown): boolean;
  /** @reactive Tracks item structure and reactive reads performed by the callback. */
  every(predicate: (item: AnyNode, index: number, array: AnyArrayNode) => unknown): boolean;
};

/** An array node with unspecified item and ancestor types. Use `ArrayNode<TItem>` when the item type is known. */
export type AnyArrayNode =
  & Signal<any[]>
  & AnyArrayApi
  & HiddenFunctionMembers<keyof AnyArrayApi>
  & {
    /** Live item at this index, or undefined when the index is outside the current structure. */
    readonly [index: number]: AnyNode | undefined;
    api: AnyArrayApi;
    $api: AnyArrayApi;
  };
