import type { Signal } from '@angular/core';

import type { AnyNode, DynamicNode } from '../types/node.type';
import type { HiddenFunctionMembers } from '../types/hidden-function-members.type';

/** Value views available during validation, without operations that write to the node. */
export type ValidatorValueSignal<TValue> = Signal<TValue> & HiddenFunctionMembers & {
  readonly committed: Signal<TValue> & HiddenFunctionMembers;
  readonly control: Signal<TValue> & HiddenFunctionMembers;
};

type UnsafeValidatorMember =
  | 'errors' | 'allErrors' | 'getError' | 'hasError' | 'valid' | 'invalid' | 'validationStatus'
  | 'pending' | 'debouncing' | 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern'
  | 'metadata' | 'validators' | 'hasValidator' | 'setValidators'
  | 'set' | 'update' | 'patch' | 'reset' | 'resetToInitial' | 'flush' | 'focus' | 'submit'
  | 'markAsTouched' | 'markAsUntouched' | 'markAsDirty' | 'markAsPristine'
  | 'disable' | 'enable' | 'markAsReadonly' | 'markAsWritable' | 'hide' | 'show'
  | 'add' | 'remove' | 'push' | 'insert' | 'removeAt' | 'moveUp' | 'moveDown' | 'move' | 'swap' | 'clear';

type PreserveHidden<T> = T extends HiddenFunctionMembers<keyof T> ? HiddenFunctionMembers<keyof T> : unknown;

type NodeView<TNode> = ValidatorNodeView<TNode>;
type ChildViews<TChildren> = { readonly [K in keyof TChildren]: NodeView<TChildren[K]> };
type ItemView<TApi> = TApi extends { items: Signal<readonly (infer TItem)[]> } ? NodeView<TItem> : never;
type ArrayView<TApi> = TApi extends { items: Signal<readonly (infer TItem)[]> } ? ValidatorNodeView<TApi & { $api: TApi; readonly [index: number]: TItem | undefined }> : never;

type ValidatorChildTraversal<TApi> = {
  forEachChild(callback: (child: TApi extends { forEachChild(callback: (child: infer TChild, key: string) => void, options?: { includeDynamic?: false }): void; forEachChild(callback: (...args: any[]) => void, options: { includeDynamic?: boolean }): void } ? NodeView<TChild> : ValidatorNodeView<DynamicNode>, key: string) => void, options?: { includeDynamic?: false }): void;
  forEachChild(callback: (child: ValidatorNodeView<DynamicNode>, key: string) => void, options: { includeDynamic?: boolean }): void;
};

type ValidatorArrayMethods<TApi> = {
  forEach(callback: (item: ItemView<TApi>, index: number, array: ArrayView<TApi>) => void): void;
  map<TResult>(callback: (item: ItemView<TApi>, index: number, array: ArrayView<TApi>) => TResult): TResult[];
  filter<TFiltered extends ItemView<TApi>>(predicate: (item: ItemView<TApi>, index: number, array: ArrayView<TApi>) => item is TFiltered): TFiltered[];
  filter(predicate: (item: ItemView<TApi>, index: number, array: ArrayView<TApi>) => unknown): ItemView<TApi>[];
  find<TFound extends ItemView<TApi>>(predicate: (item: ItemView<TApi>, index: number, array: ArrayView<TApi>) => item is TFound): TFound | undefined;
  find(predicate: (item: ItemView<TApi>, index: number, array: ArrayView<TApi>) => unknown): ItemView<TApi> | undefined;
  findIndex(predicate: (item: ItemView<TApi>, index: number, array: ArrayView<TApi>) => unknown): number;
  some(predicate: (item: ItemView<TApi>, index: number, array: ArrayView<TApi>) => unknown): boolean;
  every(predicate: (item: ItemView<TApi>, index: number, array: ArrayView<TApi>) => unknown): boolean;
  includes(item: ValidatorNodeView<AnyNode>, fromIndex?: number): boolean;
  indexOf(item: ValidatorNodeView<AnyNode>, fromIndex?: number): number;
};

type ValidatorMember<TApi, K extends keyof TApi> =
  K extends 'value' ? TApi[K] extends Signal<infer TValue> ? ValidatorValueSignal<TValue> : TApi[K]
    : K extends 'parent' | 'root' | 'form' ? TApi[K] extends Signal<infer TNode> ? Signal<NodeView<TNode>> : never
      : K extends 'children' ? ChildViews<TApi[K]>
        : K extends typeof Symbol.iterator ? () => IterableIterator<ItemView<TApi>>
          : K extends 'items' ? Signal<readonly ItemView<TApi>[]>
            : K extends 'get' | 'at' ? TApi[K] extends (...args: infer TArgs) => infer TNode ? (...args: TArgs) => NodeView<TNode> : never
              : K extends 'forEachChild' ? ValidatorChildTraversal<TApi>['forEachChild']
                : K extends keyof ValidatorArrayMethods<TApi> ? ValidatorArrayMethods<TApi>[K]
                  : K extends 'disabledReasons' ? Signal<readonly { readonly sourceNode: ValidatorNodeView<AnyNode>; readonly message?: string }[]>
                    : TApi[K];

type ValidatorApiView<TApi> = (TApi extends () => infer TValue ? Signal<TValue> & PreserveHidden<TApi> : unknown) & {
  readonly [K in keyof TApi as string extends K ? never : K extends UnsafeValidatorMember | `_${string}` ? never : K]: ValidatorMember<TApi, K>;
};

// Unknown child dictionaries retain $api navigation instead of admitting every API name.
type ValidatorNodeMembers<TNode, TApi> = (TNode extends () => infer TValue ? Signal<TValue> & PreserveHidden<TNode> : unknown) & {
  readonly [K in keyof TNode as string extends K ? never : K extends '$api' ? K : TNode[K] extends { $api: unknown } ? K : K extends UnsafeValidatorMember | `_${string}` ? never : K]:
  K extends '$api' ? ValidatorApiView<TApi>
    : TNode[K] extends { $api: unknown } ? NodeView<TNode[K]>
      : K extends keyof TApi ? ValidatorMember<TApi, K>
        : K extends typeof Symbol.iterator ? () => IterableIterator<ItemView<TApi>>
          : K extends number ? NodeView<TNode[K]> : TNode[K];
};

/** A recursive type-only view; node identity and runtime behavior are unchanged. */
export type ValidatorNodeView<TNode> = 0 extends (1 & TNode) ? ValidatorNodeView<AnyNode> : TNode extends { $api: infer TApi }
  ? ValidatorNodeMembers<TNode, TApi>
  : TNode;
