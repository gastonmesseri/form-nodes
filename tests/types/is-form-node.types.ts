import type { Equal, Expect } from './assert.types';
import { isFormNode, type Node } from '../../src/public-api';

declare const candidate: unknown;

if (isFormNode(candidate)) {
  type Narrowed = Expect<Equal<typeof candidate, Node>>;
  const node: Node = candidate;
  node.$api.markAsTouched();
}

const candidates: unknown[] = [];
const nodes = candidates.filter(isFormNode);
type Filtered = Expect<Equal<typeof nodes, Node[]>>;
