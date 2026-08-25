import type { DisabledReason, DisabledStateSource, Node } from '../types/node.type';

export type DisabledState = boolean | string;

/** Reads a static disabled option as the initial mutable state controlled by disable()/enable(). */
export const getInitialDisabledState = (source?: DisabledStateSource): DisabledState =>
  typeof source === 'function' ? false : source ?? false;

/** Reads only a continuing reactive disabled condition; static options belong to mutable state. */
export const readConfiguredDisabledState = (source?: DisabledStateSource): DisabledState =>
  typeof source === 'function' ? source() : false;

/** Converts an active disabled state into its public reason while preserving an optional message. */
export const createDisabledReason = (state: DisabledState, sourceNode: Node): DisabledReason | undefined =>
  state === false ? undefined : {
    sourceNode,
    ...(typeof state === 'string' ? { message: state } : {}),
  };
