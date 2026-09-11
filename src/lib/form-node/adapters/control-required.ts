import type { AnyNode } from '../../types/node.type';
import { readMetadata } from '../../metadata/metadata';
import { getNodeInputConfig } from '../../configuration/node-input-config';
import { REQUIRED_TRUE_METADATA } from '../../validation/constraint-metadata';

/** Checkbox required means acceptance; other controls use the node's required state. */
export const controlRequired = (node: AnyNode, checkbox: boolean): boolean => {
  if (!checkbox) return node.$api.required();
  return readMetadata(getNodeInputConfig(node).metadata(), REQUIRED_TRUE_METADATA)
    || node.$api.errors().some(error => error.kind === 'requiredTrue');
};
