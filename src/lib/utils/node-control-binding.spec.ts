// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import type { NodeControlBinding } from '../types/node.type';
import { firstControlBindingInDom, findFirstControlBindingInDom } from './node-control-binding';

const createBindings = () => {
  const container = document.createElement('div');
  const first: NodeControlBinding = { element: document.createElement('input'), focus: vi.fn() };
  const second: NodeControlBinding = { element: document.createElement('input'), focus: vi.fn() };
  const third: NodeControlBinding = { element: document.createElement('input'), focus: vi.fn() };
  container.append(first.element, second.element, third.element);
  return { container, first, second, third };
};

describe('firstControlBindingInDom', () => {
  it('handles missing bindings', () => {
    const { first } = createBindings();

    expect(firstControlBindingInDom(undefined, undefined)).toBeUndefined();
    expect(firstControlBindingInDom(first, undefined)).toBe(first);
    expect(firstControlBindingInDom(undefined, first)).toBe(first);
  });

  it('selects the earlier element regardless of argument order', () => {
    const { first, second } = createBindings();

    expect(firstControlBindingInDom(first, second)).toBe(first);
    expect(firstControlBindingInDom(second, first)).toBe(first);
    expect(first.focus).not.toHaveBeenCalled();
    expect(second.focus).not.toHaveBeenCalled();
  });

  it('keeps the first binding when both refer to the same element', () => {
    const { first } = createBindings();
    const other = { element: first.element, focus: vi.fn() };

    expect(firstControlBindingInDom(first, other)).toBe(first);
    expect(firstControlBindingInDom(first, first)).toBe(first);
  });
});

describe('findFirstControlBindingInDom', () => {
  it('handles empty and single-binding iterables', () => {
    const { first } = createBindings();

    expect(findFirstControlBindingInDom([])).toBeUndefined();
    expect(findFirstControlBindingInDom([first])).toBe(first);
  });

  it('uses DOM order instead of iterable insertion order', () => {
    const { first, second, third } = createBindings();

    expect(findFirstControlBindingInDom(new Set([third, first, second]))).toBe(first);
  });

  it('reads the current DOM order after elements move', () => {
    const { container, first, second, third } = createBindings();
    const bindings = [first, second, third];

    expect(findFirstControlBindingInDom(bindings)).toBe(first);
    container.prepend(third.element);
    expect(findFirstControlBindingInDom(bindings)).toBe(third);
  });
});
