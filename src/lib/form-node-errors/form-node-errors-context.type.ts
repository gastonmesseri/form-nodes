import type { ControlStateError } from '../form-node-state/form-node-state';

/** Context supplied once to the projected #message template when visible messages exist. */
export type FormNodeErrorsContext = {
  /** First visible resolved message, available through let-message. */
  readonly $implicit: string;
  /** Named alias of the first visible resolved message. */
  readonly message: string;
  /** Visible resolved messages, after filtering and maxMessages. */
  readonly messages: readonly string[];
  /** Error details corresponding to the visible messages, in the same order. */
  readonly errors: readonly ControlStateError[];
};
