export const getInitialMutableState = (source?: boolean | (() => boolean)): boolean => {
  return typeof source === 'boolean' ? source : false;
};

export const readStateSource = (source?: boolean | (() => boolean)): boolean => {
  return typeof source === 'function' ? source() : false;
};
