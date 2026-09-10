import type { Signal } from '@angular/core';

import type { HiddenFunctionMembers } from './hidden-function-members.type';

/**
 * Reactive value views shared by fields, groups, forms, and arrays.
 * Calling this signal is equivalent to calling the node: configured `equal` checks can retain
 * an earlier equivalent value. Prefer calling the node for ordinary application reads.
 *
 * For mutable field values, pass a new object/array/Date instance (or clone a Moment before editing it).
 * In-place mutation and setting the same reference do not notify internal signals, even when a
 * custom public `equal` comparator is configured. Derived signals and controls can otherwise stay stale.
 *
 * The nested signals provide `set()` only, not the full Angular `WritableSignal` API.
 * All setters are safe to extract and call without a receiver. Function members such as `call`,
 * `apply`, and `bind` are hidden from IntelliSense on all three views, so `committed`, `control`,
 * and their `set` methods remain easy to discover. Bare `FieldNode` annotations retain these views
 * with `any` values; specify `FieldNode<TValue>` when the value type is known.
 *
 * @example
 * ```ts
 * const name = field('Ada', { debounce: 'blur' });
 * name.value.control.set('Grace');
 * name.value.control(); // 'Grace'
 * name.value.committed(); // 'Ada'
 * name.flush();
 * name.value.committed(); // 'Grace'
 * ```
 */
export type NodeValueSignal<TValue, TSet = TValue> = Signal<TValue> & HiddenFunctionMembers & {
  /**
   * Latest committed data, bypassing configured `equal` checks on this node and its descendants.
   * **Pending debounce is still respected:** this signal does not read uncommitted control input.
   * Aggregate snapshots use committed child data, including writes hidden by child equality.
   * Angular's ordinary signal identity checks still apply; this is not an event for every write.
   */
  committed: Signal<TValue> & HiddenFunctionMembers & {
    /**
     * Assigns a complete value immediately, exactly like `node.set(value)`. Cancels pending input,
     * preserves dirty/touched state, and triggers normal committed-value validation and propagation.
     * Configured `equal` still governs exposed reads; this method does not disable that option.
     * Does not emit `[formNode]` value-change outputs by itself.
     *
     * @example
     * ```ts
     * name.value.committed.set('Grace');
     * ```
     */
    set(value: TSet): void;
  };
  /**
   * Latest control value, including this node's pending debounce, independent of configured `equal`.
   * **For an aggregate this is its own control buffer, not a recursive collection of child drafts.**
   * Without its own pending input, an aggregate reads committed child data. Read each child's
   * `value.control()` separately when pending descendant input is needed.
   */
  control: Signal<TValue> & HiddenFunctionMembers & {
    /**
     * Receives a complete control value, marks this node dirty even for an unchanged value, and
     * applies configured or inherited debounce before committing. Does not mark the node touched.
     * Normal validation and parent propagation follow the commit; `flush()` can commit early.
     * A subsequent committed write or reset cancels pending input.
     * Does not emit `[formNode]` value-change outputs by itself: those belong to bound adapters.
     *
     * @example
     * ```ts
     * name.value.control.set('Grace');
     * ```
     */
    set(value: TSet): void;
  };
};
