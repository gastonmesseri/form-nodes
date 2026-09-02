export const getInitialMutableState = (source?: boolean | (() => boolean)): boolean =>
  typeof source === 'boolean' ? source : false;

export const readStateSource = (source?: boolean | (() => boolean)): boolean =>
  typeof source === 'function' ? source() : false;
