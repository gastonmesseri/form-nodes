/** Structural position supplied to node callbacks. */
export type NodeCallbackContext = {
  /**
   * Zero-based position of the item containing this node in its nearest array ancestor, or
   * `null` when no array contains it. A field inside nested groups uses the index of the
   * enclosing array item, not its property key. With nested arrays, the innermost containing
   * array wins. Reads reflect moves, attachment, and detachment; the result is `null` whenever
   * no containing array remains. Reactive availability callbacks and synchronous validators
   * track this read and update after a move. Async validators track it when read before their
   * first `await`; parameterized async validators should read it in `params` when a move must
   * start new work. Value-change callbacks receive the position at delivery time, and form
   * submission callbacks receive it when invoked. This is a number, not a signal; read it in
   * each callback execution instead of saving an earlier index. On a node, the same location
   * is available as the reactive `node.index()` signal.
   * Validators configured with `reactive: false` do not track the structural read.
   *
   * ```ts
   * const rows = array({
   *   details: {
   *     email: field('', ({ index }) => {
   *       return index === 0
   *         ? { kind: 'firstRow' }
   *         : null;
   *     }),
   *   },
   * }, { initialLength: 2 });
   * rows[0]!.details.email.invalid(); // true
   * rows[1]!.details.email.valid(); // true
   * ```
   */
  readonly index: number | null;
};
