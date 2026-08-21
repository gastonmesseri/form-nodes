import type { ValidationError } from '../validation/validation.type';

type WritableTargetNode = {
  targetNode?: unknown;
};

/** Assigns the current node to an error that does not already define a target. */
export const addDefaultTargetNode = <TNode>(
  error: ValidationError.WithOptionalTargetNode<TNode>,
  targetNode: TNode,
): ValidationError.WithTargetNode<TNode> => {
  (error as WritableTargetNode).targetNode ??= targetNode;
  return error as ValidationError.WithTargetNode<TNode>;
};
