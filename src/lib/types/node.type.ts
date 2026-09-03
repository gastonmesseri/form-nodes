import type { Signal } from '@angular/core';

import type { Field } from '../primitives/field.type';
import type { FormApi } from '../primitives/form.type';
import type { GroupApi } from '../primitives/group.type';
import type { ArrayNode } from '../primitives/array.type';
import type { OpaqueAngularField } from '../interop/angular-field.type';
import type { HiddenFunctionMembers } from './hidden-function-members.type';

export type MarkAsTouchedOptions = {
  /** When true, marks only the current node and leaves its descendants untouched. */
  skipDescendants?: boolean;
};

/** A static or reactive condition that disables a node, optionally with a user-facing reason. */
export type DisabledStateSource = boolean | string | (() => boolean | string);

/** Internal strategy used to delay control-originated values before committing them to the model. */
export type ControlDebounce = number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);

/** Identifies one active cause of a node's disabled state. */
export type DisabledReason<TNode extends Node = Node> = {
  /** Node on which this reason originated. Descendants retain the original source node. */
  readonly sourceNode: TNode;
  /** Optional user-facing explanation supplied by the disabled option or disable(). */
  readonly message?: string;
};

export type NodeControlBinding = {
  /** Host element associated with this control binding. */
  readonly element: Element;
  /** Focuses the bound native or custom control. */
  focus(options?: FocusOptions): void;
  /** Resets binding-owned interaction or parsing state when supported. */
  reset?(): void;
};

export type NodeApi = {
  /** Returns the concrete primitive represented by this node. */
  nodeType(): NodeType;
  /** Nearest explicit `form()` containing this node, or `null` when no form workflow owns it. */
  form: Signal<Node | null>;
  /** Complete root node containing this node. A root node returns itself. */
  root: Signal<Node>;
  /** Immediate structural parent of this node, or `null` when it is a root or has been detached. */
  parent: Signal<Node | null>;
  /**
   * Property and array-index segments from the complete root to this node. Root nodes use `[]`.
   * Array indexes are represented as strings.
   *
   * @example
   * ```ts
   * myForm.contacts[0]?.email.path();
   * // ['contacts', '0', 'email']
   * ```
   */
  path: Signal<readonly string[]>;
  /**
   * Current committed value represented by this node. Reading it participates in signal tracking.
   *
   * Prefer calling the node directly instead of using `name.value()` for ordinary value reads:
   *
   * @example
   * ```ts
   * const name = field('Marco');
   *
   * name(); // 'Marco'
   * ```
   */
  value: Signal<any>;
  /** Value represented by a control bound directly to this node, including input awaiting a debounced commit. */
  controlValue: Signal<any>;
  /**
   * Property or array index under which this node is stored, or `null` when it is a root node.
   *
   * @example
   * ```ts
   * myForm.age.keyInParent(); // 'age'
   * ```
   */
  keyInParent: Signal<string | number | null>;
  /**
   * Assigns a complete committed value immediately without marking the node dirty.
   *
   * @example
   * ```ts
   * name.set('Lia');
   * ```
   */
  set(value: any): void;
  /**
   * Computes and assigns a complete committed value without marking the node dirty.
   *
   * @example
   * ```ts
   * count.update(value => value + 1);
   * ```
   */
  update(updater: (value: any) => any): void;
  /** Applies a node-specific partial update without marking the node dirty. */
  patch(value: any): void;
  /**
   * Clears interaction state and pending control input throughout the reset scope, optionally
   * assigning a new complete value first.
   */
  reset(...args: [] | [value: any]): void;
  /** Aggregated validation phase for this node and its subtree. */
  validationStatus: Signal<'valid' | 'invalid' | 'unknown'>;
  /** Whether this node and its descendants have completed validation without errors. */
  valid: Signal<boolean>;
  /** Whether this node or any descendant currently contributes a validation error. */
  invalid: Signal<boolean>;
  /**
   * Validation errors belonging directly to this node, excluding descendant-owned errors.
   *
   * @example
   * ```ts
   * node.errors();
   * // [{ kind: 'required', message: 'Value is required.', targetNode: node }]
   * ```
   */
  errors: Signal<readonly { readonly kind: string; readonly targetNode: Node }[]>;
  /**
   * Validation errors from this node and its complete subtree in structural order.
   *
   * @example
   * ```ts
   * node.allErrors();
   * // [{ kind: 'required', message: 'Value is required.', targetNode: node }]
   * ```
   */
  allErrors: Signal<readonly { readonly kind: string; readonly targetNode: Node }[]>;
  /**
   * Returns the first error belonging directly to this node and matching `kind`.
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends string>(kind: TKind): ({ readonly kind: TKind; readonly targetNode: Node }) | undefined;
  /** Whether active validation metadata currently marks this node as required. */
  required: Signal<boolean>;
  /** Whether asynchronous validation is active on this node or any descendant. */
  pending: Signal<boolean>;
  /**
   * Whether this node is a form running its submission action, or has an ancestor form that is
   * currently running one.
   */
  submitting: Signal<boolean>;
  /** Whether a control-originated value is awaiting commit on this node or any descendant. */
  debouncing: Signal<boolean>;
  /** Immediately commits pending control-originated values on this node and its flush scope. */
  flush(): void;
  /** Focuses the first control bound to this node or its descendants, when one exists. */
  focus(options?: FocusOptions): void;
  /**
   * Whether this node or any descendant has been marked touched.
   *
   * ℹ️ Disabled, readonly, or hidden nodes report `false` and do not contribute touched state to ancestors.
   */
  touched: Signal<boolean>;
  /**
   * Logical inverse of `touched()`.
   *
   * Whether neither this node nor any contributing descendant currently reports having been touched.
   */
  untouched: Signal<boolean>;
  /**
   * Marks this node and, by default, its descendants as touched, making effective `touched()` true
   * and `untouched()` false while those nodes are interactive.
   */
  markAsTouched(options?: {
    /** When true, marks only the current node and leaves its descendants untouched. */
    skipDescendants?: boolean;
  }): void;
  /** Clears touched state, making `touched()` false and `untouched()` true throughout the affected scope. */
  markAsUntouched(): void;
  /**
   * Whether this node currently reports user-modified state.
   *
   * Control-originated updates and `markAsDirty()` record dirty state; programmatic value updates
   * do not. Aggregate nodes also report `true` when an interactive descendant is dirty.
   */
  dirty: Signal<boolean>;
  /**
   * Logical inverse of `dirty()`.
   *
   * Whether neither this node nor any contributing descendant reports modification through user interaction.
   */
  pristine: Signal<boolean>;
  /** Marks this node's own state dirty, making `dirty()` true and `pristine()` false while it is interactive. */
  markAsDirty(): void;
  /**
   * Clears this node's own dirty state. `pristine()` becomes true and `dirty()` false only when no
   * contributing descendant remains dirty.
   */
  markAsPristine(): void;
  /** Whether this node is effectively disabled by a local or inherited reason. */
  disabled: Signal<boolean>;
  /**
   * Parent reasons followed by the active reasons originating on this node.
   *
   * @example
   * ```ts
   * node.disabledReasons();
   * // [
   * //   {
   * //     sourceNode: parent,
   * //     message: 'Section is unavailable',
   * //   },
   * // ]
   * ```
   */
  disabledReasons: Signal<readonly DisabledReason[]>;
  /**
   * Logical inverse of `disabled()`.
   *
   * Whether this node has no active local or inherited disabled reason and can participate normally.
   */
  enabled: Signal<boolean>;
  /**
   * Disables this node, optionally recording a user-facing reason.
   * Sets `disabled()` to true and `enabled()` to false on this node and its effective subtree.
   *
   * @example Disable without a reason
   * ```ts
   * node.disable();
   * ```
   *
   * @example Disable with a reason
   * ```ts
   * node.disable('Unavailable');
   * ```
   */
  disable(message?: string): void;
  /**
   * Clears the imperative disabled state created by `disable()`. `enabled()` becomes true only
   * where no configured or inherited disabled reason remains active.
   */
  enable(): void;
  /** Whether this node is effectively readonly through local configuration or an ancestor. */
  readonly: Signal<boolean>;
  /**
   * Logical inverse of `readonly()`.
   *
   * Whether this node accepts value changes from a control bound directly to it.
   */
  writable: Signal<boolean>;
  /** Marks this node and its subtree readonly, making `readonly()` true and `writable()` false. */
  markAsReadonly(): void;
  /**
   * Clears this node's imperative readonly state. `writable()` becomes true only where no
   * configured or inherited readonly state remains active.
   */
  markAsWritable(): void;
  /** Whether this node is effectively hidden through local configuration or an ancestor. */
  hidden: Signal<boolean>;
  /**
   * Logical inverse of `hidden()`.
   *
   * Whether this node is currently intended to be shown to the user.
   */
  visible: Signal<boolean>;
  /** Hides this node and its subtree, making `hidden()` true and `visible()` false. */
  hide(): void;
  /**
   * Clears this node's imperative hidden state. `visible()` becomes true only where no configured
   * or inherited hidden state remains active.
   */
  show(): void;
};

export type Node = {
  /** Returns this node's current committed value and participates in signal dependency tracking. */
  (): any;
} & {
  /**
   * Collision-safe access to the node API.
   *
   * Prefer `api` for normal application code. Use `$api` when a form declares a child named
   * `api`, or when generic node code requires an access path that cannot collide with children.
   *
   * Prefer `api` for ordinary application code; `$api` remains a supported, stable escape hatch.
   */
  $api: NodeApi;
};
export type PublicNode<TNode extends Node> = Node extends TNode
  ? TNode & HiddenFunctionMembers
  : TNode;

/**
 * A dynamically discovered node whose concrete primitive is not known statically.
 *
 * It exposes the state and operations shared by every node while keeping native callable
 * members such as `apply`, `bind`, and `call` hidden. Primitive-specific operations require a
 * statically known node type.
 */
export type DynamicNode =
  & PublicNode<Node>
  & Omit<NodeApi, 'patch'>
  & {
    /** Complete common node API. */
    api: NodeApi;
    /** Opaque terminal adapter for Angular's `[formField]` directive. */
    readonly $field: OpaqueAngularField;
  };
type RootLookupDepth = readonly [unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown];

export type RootNode<TNode extends Node, TDepth extends readonly unknown[] = RootLookupDepth> =
  TDepth extends readonly [unknown, ...infer TRest]
    ? TNode extends { $api: { parent: Signal<infer TParent | null> } }
      ? TParent extends Node
        ? Node extends TParent ? TNode : RootNode<TParent, TRest>
        : TNode
      : TNode
    : Node;
/** Generic form navigation without asserting unknown child names or hiding valid child collisions. */
export type NavigationForm = Node & FormApi<any> & { api: FormApi<any>; $api: FormApi<any> };

/** Complete structural node APIs when an ancestor's exact declaration is unavailable. */
export type NavigationRoot = Field<any> | NavigationForm | (Node & GroupApi<any> & { api: GroupApi<any>; $api: GroupApi<any> }) | ArrayNode<any>;

export type NearestForm<TNode extends Node> = Node extends TNode ? NavigationForm
  : TNode extends { $api: { form: Signal<infer TForm> } }
    ? Exclude<TForm, null> extends Node ? Exclude<TForm, null> : never
    : never;
export type NodeType = 'field' | 'group' | 'form' | 'array';
export type InternalNodeApi = NodeApi & {
  /** Latest committed model used by internal aggregation, control synchronization, and buffers. */
  _value: Signal<any>;
  _controlDebounce: Signal<ControlDebounce | undefined>;
  _controlValue: Signal<any>;
  _setControlValue(value: any): void;
  _flushControlValueOnBlur(): void;
  _clone(): Node;
  _setParent(parent: Node | null, key?: string | number): void;
  _refreshInjector(): void;
  _registerControlBinding(binding: NodeControlBinding): () => void;
  _getControlBindingForFocus(): NodeControlBinding | undefined;
};
export type InternalNode = (() => any) & { $api: InternalNodeApi };
export type Nodes = Record<string, Node>;
export type NodeDefinition = Node | NodeDefinitions;
export interface NodeDefinitions {
  [key: string]: NodeDefinition;
}
/**
 * Committed value inferred from any `form()`, `group()`, `array()`, or `field()` instance.
 * Equivalent to `ReturnType<TNode>`; preserves nested values and field nullability.
 *
 * @example
 * ```ts
 * const profile = form({
 *   name: field('Marco'),
 *   address: { city: field('Zurich') },
 *   contacts: array({ email: field('') }),
 * });
 *
 * type ProfileValue = FormNodeValue<typeof profile>;
 * type NameValue = FormNodeValue<typeof profile.name>; // string | null
 * type AddressValue = FormNodeValue<typeof profile.address>; // { city: string | null }
 * type ContactsValue = FormNodeValue<typeof profile.contacts>; // { email: string | null }[]
 * ```
 */
export type FormNodeValue<TNode extends Node> = ReturnType<TNode>;

export type NodeValue<TNode> = TNode extends () => infer TValue ? TValue : never;
export type NodeKeyInParent<TParent extends Node> = Node extends TParent
  ? string | number | null
  : NodeValue<TParent> extends readonly unknown[] ? number | null : string;
export type NodeSet<TNode> =
  TNode extends { $api: { set(value: infer TValue): void } } ? TValue : never;
export type NodePatch<TNode> =
  TNode extends { $api: { patch(value: infer TValue): void } } ? TValue : never;
