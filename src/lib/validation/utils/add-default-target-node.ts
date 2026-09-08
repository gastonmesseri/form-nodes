import type { ValidationErrorWithTargetNode, ValidationErrorWithOptionalTargetNode } from '../validation.type';

type WritableTargetNode = {
  targetNode?: unknown;
};

/** Assigns the current node to an error that does not already define a target. */
export const addDefaultTargetNode = <TNode>(
  error: ValidationErrorWithOptionalTargetNode<TNode>,
  targetNode: TNode,
): ValidationErrorWithTargetNode<TNode> => {
  (error as WritableTargetNode).targetNode ??= targetNode;
  return error as ValidationErrorWithTargetNode<TNode>;
};
