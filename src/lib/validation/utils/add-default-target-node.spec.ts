import { describe, expect, it } from 'vitest';

import { addDefaultTargetNode } from './add-default-target-node';

describe('addDefaultTargetNode', () => {
  it('assigns the default target node', () => {
    const targetNode = () => 'David';
    const error = addDefaultTargetNode({ kind: 'required' }, targetNode);
    expect(error.targetNode).toBe(targetNode);
  });

  it('preserves an existing target node', () => {
    const existingTarget = () => 'Existing';
    const defaultTarget = () => 'Default';
    const error = addDefaultTargetNode({ kind: 'custom', targetNode: existingTarget }, defaultTarget);
    expect(error.targetNode).toBe(existingTarget);
  });
});
