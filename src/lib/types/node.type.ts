import type { Signal } from '@angular/core';

import type { NodeSignal } from './node-signal.type';
import type { FormApi } from '../primitives/form.type';
import type { GroupApi } from '../primitives/group.type';
import type { FieldNode } from '../primitives/field.type';
import type { ArrayNode } from '../primitives/array.type';
import type { CallableNodeApi } from './callable-node-api.type';
import type { NodeValueSignal } from './node-value-signal.type';
import type { NodeErrorsSignal } from './node-errors-signal.type';
import type { HiddenFunctionMembers } from './hidden-function-members.type';
import type { ValidationErrorWithTargetNode } from '../validation/validation.type';

export type MarkAsTouchedOptions = {
  /**
   * Skips recursively touching and committing descendants; the current node still commits its own pending input.
   *
   * **Default:** `false`; visit interactive descendants too.
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
   * profile.markAsTouched({
   *   skipDescendants: true,
   * });
   * profile.name.touched(); // false
   * ```
   */
  skipDescendants?: boolean;
};

/** A static or reactive condition that disables a node, optionally with a user-facing reason. */
export type DisabledStateSource = boolean | string | (() => boolean | string);

/** Internal strategy used to delay control-originated values before committing them to the model. */
export type ControlDebounce = number | 'blur' | ((abortSignal: AbortSignal) => void | PromiseLike<void>);

/** Identifies one active cause of a node's disabled state. */
export type DisabledReason<TNode extends AnyNode = AnyNode> = {
  /**
   * Node on which this reason originated. Descendants retain the original source node.
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
   * profile.disable('Locked');
   * const reason =
   *   profile.name.disabledReasons()[0];
   * reason?.sourceNode === profile; // true
   * ```
   */
  readonly sourceNode: TNode;
  /**
   * Optional user-facing explanation supplied by the disabled option or disable().
   *
   * ```ts
   * const profile = form({ name: field('Ada') });
   * profile.disable('Locked');
   * const reason =
   *   profile.name.disabledReasons()[0];
   * reason?.message; // 'Locked'
   * ```
   */
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
  /**
   * Returns the concrete primitive represented by this node.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.nodeType(); // 'field'
   * ```
   */
  nodeType(): NodeType;
  /**
   * Nearest explicit `form()` containing this node, or `null` when no form workflow owns it.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.form() === profile; // true
   * ```
   */
  form: Signal<AnyNode | null>;
  /**
   * Complete root node containing this node. A root node returns itself.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.root() === profile; // true
   * ```
   */
  root: Signal<AnyNode>;
  /**
   * Immediate structural parent of this node, or `null` when it is a root or has been detached.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.parent() === profile; // true
   * ```
   */
  parent: Signal<AnyNode | null>;
  /**
   * Property and array-index segments from the complete root to this node. Root nodes use `[]`.
   * Array indexes are represented as strings.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.path(); // ['name']
   * ```
   */
  path: Signal<readonly string[]>;
  /**
   * Current committed value represented by this node. Reading it participates in signal tracking.
   *
   * Prefer calling the node directly instead of using `name.value()` for ordinary value reads:
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name(); // 'Ada'
   * ```
   */
  value: NodeValueSignal<any>;
  /**
   * Returns a stable, live readonly signal of the exposed value, with no node operations.
   * Preserves configured equality and committed-value reads; pending control input remains pending.
   * This does not mark the node readonly or prevent deep mutation of object values.
   * The node and its `$api` return the same signal, and the method is safe to extract.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const value = profile.asReadonly();
   * profile.name.set('Lia');
   * value(); // { name: 'Lia' }
   * ```
   */
  asReadonly(): Signal<any>;
  /**
   * Property or array index under which this node is stored, or `null` when it is a root node.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.keyInParent(); // 'name'
   * ```
   */
  keyInParent: Signal<string | number | null>;
  /**
   * Assigns a complete committed value immediately without marking the node dirty.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.set('Lia');
   * profile.name(); // 'Lia'
   * ```
   */
  set(value: any): void;
  /**
   * Computes and assigns a complete committed value without marking the node dirty.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.update(name => `${name}!`);
   * profile.name(); // 'Ada!'
   * ```
   */
  update(updater: (value: any) => any): void;
  /**
   * Updates supplied object branches or replaces complete array/field values without marking the node dirty.
   *
   * ```ts
   * const node = form({ name: field('Ada') });
   * node.patch({ name: 'Lia' });
   * node.name(); // 'Lia'
   * ```
   */
  patch(value: any): void;
  /**
   * Clears interaction state and pending control input throughout the reset scope, optionally
   * assigning a new complete value first.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.set('Lia');
   * profile.name.markAsDirty();
   * profile.name.reset();
   * profile.name(); // 'Lia'
   * profile.name.dirty(); // false
   * ```
   */
  reset(...args: [] | [value: any]): void;
  /**
   * Restores captured initial values, cancels buffered input, and clears subtree dirty/touched state.
   * Object nodes keep their current schema; arrays restore their initial values, count, and order.
   * Programmatic writes do not redefine the baseline. Current validators and availability remain.
   * Supported data containers are copied; opaque instances and accessor state retain references.
   * This does not emit control-originated value outputs. See concrete node APIs for full details.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.set('Lia');
   * profile.name.resetToInitial();
   * profile.name(); // 'Ada'
   * ```
   */
  resetToInitial(): void;
  /**
   * Aggregated validation phase for this node and its subtree.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.validationStatus(); // 'valid'
   * ```
   */
  validationStatus: Signal<'valid' | 'invalid' | 'unknown'>;
  /**
   * Whether this node and its descendants have completed validation without errors.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.valid(); // true
   * ```
   */
  valid: Signal<boolean>;
  /**
   * Whether this node or any descendant currently contributes a validation error.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.invalid(); // false
   * ```
   */
  invalid: Signal<boolean>;
  /**
   * Validation errors belonging directly to this node by default.
   * Pass `{ descendants: true }` to include descendants, exactly as `allErrors()`.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * profile.name.errors()
   *   .map(error => error.kind);
   * // ['blocked']
   * ```
   *
   * @reactive Tracks the selected own or subtree error signal.
   */
  errors: NodeErrorsSignal<AnyNode>;
  /**
   * Validation errors from this node and its complete subtree in structural order.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * profile.name.allErrors()
   *   .map(error => error.kind);
   * // ['blocked']
   * ```
   */
  allErrors: Signal<readonly ValidationErrorWithTargetNode<AnyNode>[]>;
  /**
   * Returns the first error belonging directly to this node and matching `kind`.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * profile.name.getError('blocked')?.kind;
   * // 'blocked'
   * ```
   *
   * @reactive Maintains an independent reactive computation for each `kind`.
   */
  getError<TKind extends string>(kind: TKind): (ValidationErrorWithTargetNode<AnyNode> & { readonly kind: TKind }) | undefined;
  /**
   * Whether this node's own errors include the kind; does not search descendants.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.setValidators(() => ({
   *   kind: 'blocked',
   * }));
   * profile.name.hasError('blocked'); // true
   * ```
   *
   * @reactive Tracks current errors.
   */
  hasError(kind: string): boolean;
  /**
   * Whether this exact validator is directly registered, or resolved when resolve is true.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * const rule = validator(() => null);
   * profile.name.setValidators(rule);
   * profile.name.hasValidator(rule); // true
   * ```
   *
   * @reactive Tracks registration changes and, with resolve, synchronous composition dependencies.
   */
  hasValidator(validator: (context: any) => unknown, options?: { resolve?: boolean }): boolean;
  /**
   * Whether active validation metadata currently marks this node as required.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.required(); // false
   * ```
   */
  required: Signal<boolean>;
  /**
   * Whether asynchronous validation is active on this node or any descendant.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.pending(); // false
   * ```
   */
  pending: Signal<boolean>;
  /**
   * Whether this node is a form running its submission action, or has an ancestor form that is
   * currently running one.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.submitting(); // false
   * ```
   */
  submitting: Signal<boolean>;
  /**
   * Whether a control-originated value is awaiting commit on this node or any descendant.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.debouncing(); // false
   * ```
   */
  debouncing: Signal<boolean>;
  /**
   * Immediately commits pending control-originated values on this node and its flush scope.
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
   * Focuses the first control bound to this node or its descendants, when one exists.
   *
   * ```ts
   * import { Component } from '@angular/core';
   *
   * @Component({
   *   imports: [FormNodeDirective],
   *   template: `
   *     <input [formNode]="profile.name" />
   *     <button (click)="profile.name.focus()">
   *       Focus name
   *     </button>
   *   `,
   * })
   * export class ProfilePage {
   *   profile = form({ name: field('Ada') });
   * }
   * ```
   */
  focus(options?: FocusOptions): void;
  /**
   * Whether this node or any descendant has been marked touched.
   *
   * ℹ️ Disabled, readonly, or hidden nodes report `false` and do not contribute touched state to ancestors.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.touched(); // false
   * ```
   */
  touched: Signal<boolean>;
  /**
   * Logical inverse of `touched()`.
   *
   * Whether neither this node nor any contributing descendant currently reports having been touched.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.untouched(); // true
   * ```
   */
  untouched: Signal<boolean>;
  /**
   * Marks this node and, by default, its interactive descendants as touched and commits their
   * pending control values for every debounce strategy.
   *
   * This can change committed values and trigger validation and value-change callbacks,
   * even when nodes are already touched. Noninteractive subtrees ignore this operation.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.markAsTouched();
   * profile.name.touched(); // true
   * ```
   */
  markAsTouched(options?: {
    /**
     * Skips recursively touching and committing descendants; the current node still commits its own pending input.
     *
     * **Default:** `false`; visit interactive descendants too.
     *
     * ```ts
     * const profile = form({ name: field('Ada') });
     * profile.markAsTouched({
     *   skipDescendants: true,
     * });
     * profile.name.touched(); // false
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
   * profile.name.markAsTouched();
   * profile.name.markAsUntouched();
   * profile.name.touched(); // false
   * ```
   */
  markAsUntouched(): void;
  /**
   * Whether this node currently reports user-modified state.
   *
   * Control-originated updates and `markAsDirty()` record dirty state; programmatic value updates
   * do not. Aggregate nodes also report `true` when an interactive descendant is dirty.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.dirty(); // false
   * ```
   */
  dirty: Signal<boolean>;
  /**
   * Logical inverse of `dirty()`.
   *
   * Whether neither this node nor any contributing descendant reports modification through user interaction.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.pristine(); // true
   * ```
   */
  pristine: Signal<boolean>;
  /**
   * Marks this node's own state dirty, making `dirty()` true and `pristine()` false while it is interactive.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.markAsDirty();
   * profile.name.dirty(); // true
   * ```
   */
  markAsDirty(): void;
  /**
   * Clears this node's own dirty state. `pristine()` becomes true and `dirty()` false only when no
   * contributing descendant remains dirty.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.markAsDirty();
   * profile.name.markAsPristine();
   * profile.name.dirty(); // false
   * ```
   */
  markAsPristine(): void;
  /**
   * Whether this node is effectively disabled by a local or inherited reason.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.disabled(); // false
   * ```
   */
  disabled: Signal<boolean>;
  /**
   * Parent reasons followed by the active reasons originating on this node.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.disable('Locked');
   * profile.name.disabledReasons()[0]?.message;
   * // 'Locked'
   * ```
   */
  disabledReasons: Signal<readonly DisabledReason[]>;
  /**
   * Logical inverse of `disabled()`.
   *
   * Whether this node has no active local or inherited disabled reason and can participate normally.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.enabled(); // true
   * ```
   */
  enabled: Signal<boolean>;
  /**
   * Disables this node, optionally recording a user-facing reason.
   * Sets `disabled()` to true and `enabled()` to false on this node and its effective subtree.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.disable('Locked');
   * profile.name.disabled(); // true
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
   * profile.name.disable();
   * profile.name.enable();
   * profile.name.disabled(); // false
   * ```
   */
  enable(): void;
  /**
   * Whether this node is effectively readonly through local configuration or an ancestor.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.readonly(); // false
   * ```
   */
  readonly: Signal<boolean>;
  /**
   * Logical inverse of `readonly()`.
   *
   * Whether this node accepts value changes from a control bound directly to it.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.writable(); // true
   * ```
   */
  writable: Signal<boolean>;
  /**
   * Marks this node and its subtree readonly, making `readonly()` true and `writable()` false.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.markAsReadonly();
   * profile.name.readonly(); // true
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
   * profile.name.markAsReadonly();
   * profile.name.markAsWritable();
   * profile.name.readonly(); // false
   * ```
   */
  markAsWritable(): void;
  /**
   * Whether this node is effectively hidden through local configuration or an ancestor.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.hidden(); // false
   * ```
   */
  hidden: Signal<boolean>;
  /**
   * Logical inverse of `hidden()`.
   *
   * Whether this node is currently intended to be shown to the user.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.visible(); // true
   * ```
   */
  visible: Signal<boolean>;
  /**
   * Hides this node and its subtree, making `hidden()` true and `visible()` false.
   *
   * ```ts
   * const profile = form({
   *   name: field('Ada'),
   * });
   * profile.name.hide();
   * profile.name.hidden(); // true
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
   * profile.name.hide();
   * profile.name.show();
   * profile.name.hidden(); // false
   * ```
   */
  show(): void;
};

/**
 * Common callable contract for any field, group, form, or array node.
 *
 * **Use `AnyNode` through its `$api` property for all state and operations.**
 * Child names can override direct state and operations, so the generic type cannot
 * safely expose those members directly. Use `myAnyNode.$api.valid()` or
 * `myAnyNode.$api.markAsTouched()` for guaranteed access. Call `myAnyNode()` to read its value.
 *
 * Use `DynamicNode` for direct common members only when the declaration is known not to shadow
 * that surface. Neither type changes the node or resolves collisions at runtime.
 * Native function members may appear in IntelliSense. They are not guaranteed node operations;
 * hiding them with `HiddenFunctionMembers` would exclude nodes that override those names.
 * Value types are unspecified; retain the inferred node type when value precision is needed.
 *
 * ```ts
 * const node: AnyNode = form({
 *   name: field('Ada'),
 * });
 * node.$api.valid(); // true
 * ```
 */
export type AnyNode = Signal<any> & {
  /**
   * Returns this node's exposed value after configured equality and participates in signal dependency tracking.
   *
   * ```ts
   * const node: AnyNode = form({
   *   name: field('Ada'),
   * });
   * node(); // { name: 'Ada' }
   * ```
   */
  (): any;
} & {
  /**
   * Collision-safe access to the node API.
   *
   * **Use this property for all state and operations on `AnyNode`.** Direct names may
   * be child nodes, while `$api` always refers to the node's state and operations.
   *
   * ```ts
   * const node: AnyNode = form({
   *   name: field('Ada'),
   * });
   * node.$api.valid(); // true
   * ```
   */
  $api: NodeSignal<any> & NodeApi;
};
export type PublicNode<TNode extends AnyNode> = AnyNode extends TNode
  ? TNode & HiddenFunctionMembers
  : TNode;

/**
 * A dynamically discovered node whose concrete primitive is not known statically.
 *
 * It exposes the state and operations shared by every node while keeping native callable
 * members such as `apply`, `bind`, and `call` hidden. Primitive-specific operations require a
 * statically known node type.
 * Use this direct-member view only when the declaration is known not to shadow its members.
 * For an arbitrary node with unknown child names, use `AnyNode` and access state and operations
 * through `$api`. A type assertion to `DynamicNode` does not make colliding members safe.
 *
 * ```ts
 * const profile = form({ name: field('Ada') });
 * profile.add('age', field(36));
 * const age = profile.get('age');
 * age?.(); // 36
 * age?.valid(); // true
 * ```
 */
export type DynamicNode =
  & PublicNode<AnyNode>
  & Omit<NodeApi, 'patch'>;
type RootLookupDepth = readonly [unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown];

export type RootNode<TNode extends AnyNode, TDepth extends readonly unknown[] = RootLookupDepth> =
  TDepth extends readonly [unknown, ...infer TRest]
    ? TNode extends { $api: { parent: Signal<infer TParent | null> } }
      ? TParent extends AnyNode
        ? AnyNode extends TParent ? TNode : RootNode<TParent, TRest>
        : TNode
      : TNode
    : AnyNode;
/** Generic form navigation without asserting unknown child names or hiding valid child collisions. */
export type NavigationForm = NodeSignal<any> & FormApi<any> & { $api: CallableNodeApi<FormApi<any>> };

/** Complete structural node APIs when an ancestor's exact declaration is unavailable. */
export type NavigationRoot = FieldNode<any> | NavigationForm | (NodeSignal<any> & GroupApi<any> & { $api: CallableNodeApi<GroupApi<any>> }) | ArrayNode<any>;

export type NearestForm<TNode extends AnyNode> = AnyNode extends TNode ? NavigationForm
  : TNode extends { $api: { form: Signal<infer TForm> } }
    ? Exclude<TForm, null> extends AnyNode ? Exclude<TForm, null> : never
    : never;
export type NodeType = 'field' | 'group' | 'form' | 'array';
export type InternalNodeApi = NodeApi & {
  /** Latest committed model used by internal aggregation, control synchronization, and buffers. */
  _value: Signal<any>;
  _controlDebounce: Signal<ControlDebounce | undefined>;
  _controlValue: Signal<any>;
  _setControlValue(value: any, onCommit?: () => void): void;
  _flushControlValueOnBlur(): void;
  _captureInitialValue(): void;
  _resetToInitial(value: any): void;
  _clone(): AnyNode;
  _setParent(parent: AnyNode | null, key?: string | number): void;
  _refreshInjector(): void;
  _registerControlBinding(binding: NodeControlBinding): () => void;
  _getControlBindingForFocus(): NodeControlBinding | undefined;
};
export type InternalNode = Signal<any> & { $api: NodeSignal<any> & InternalNodeApi };
export type Nodes = Record<string, AnyNode>;
export type NodeDefinition = AnyNode | NodeDefinitions;
export interface NodeDefinitions {
  [key: string]: NodeDefinition;
}
/**
 * Committed value inferred from any `form()`, `group()`, `array()`, or `field()` instance.
 * Equivalent to `ReturnType<TNode>`; preserves nested values and field nullability.
 *
 * ```ts
 * const profile = form({
 *   name: field('Marco'),
 *   address: { city: field('Zurich') },
 *   contacts: array({ email: field('') }),
 * });
 *
 * type ProfileValue = FormNodeValue<
 *   typeof profile
 * >;
 * type NameValue = FormNodeValue<
 *   typeof profile.name
 * >; // string | null
 * type AddressValue = FormNodeValue<
 *   typeof profile.address
 * >; // { city: string | null }
 * type ContactsValue = FormNodeValue<
 *   typeof profile.contacts
 * >; // { email: string | null }[]
 * ```
 */
export type FormNodeValue<TNode extends AnyNode> = ReturnType<TNode>;

export type NodeValue<TNode> = TNode extends () => infer TValue ? TValue : never;
export type NodeKeyInParent<TParent extends AnyNode> = AnyNode extends TParent
  ? string | number | null
  : NodeValue<TParent> extends readonly unknown[] ? number | null : string;
export type NodeSet<TNode> =
  TNode extends { $api: { set(value: infer TValue): void } } ? TValue : never;
export type NodePatch<TNode> =
  TNode extends { $api: { patch(value: infer TValue): void } } ? TValue : never;
