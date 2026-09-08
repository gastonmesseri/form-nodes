import type { Equal, Expect } from './assert.types';
import { isFormNode, type AnyNode } from '../../src/public-api';

declare const candidate: unknown;

if (isFormNode(candidate)) {
  type Narrowed = Expect<Equal<typeof candidate, AnyNode>>;
  const node: AnyNode = candidate;
  node.$api.markAsTouched();
}

const candidates: unknown[] = [];
const nodes = candidates.filter(isFormNode);
type Filtered = Expect<Equal<typeof nodes, AnyNode[]>>;
