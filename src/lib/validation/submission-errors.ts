import { computed, signal, untracked } from '@angular/core';

import type { FormNode } from '../primitives/form.type';
import type { ArrayNode } from '../primitives/array.type';
import type { AnyNode, InternalNode } from '../types/node.type';
import type { ValidationErrorWithOptionalTargetNode } from './validation.type';
import { registerExternalValidationErrors } from './external-validation-errors';

type SubmissionError = ValidationErrorWithOptionalTargetNode<AnyNode>;

const states = new WeakMap<AnyNode, ReturnType<typeof createState>>();

function createState(node: AnyNode) {
  const resetVersion = signal(0);
  const result = signal<{ token: object; errors: readonly SubmissionError[] } | undefined>(undefined);
  // A fresh token records dependency changes, including edits reverted before the next read.
  const token = computed(() => {
    (node as InternalNode).$api._value();
    // Aggregate public control values do not compose child drafts, but server errors must notice them.
    visit(node, (child) => { (child as InternalNode).$api._controlValue(); });
    resetVersion();
    let ancestor: AnyNode | null = node;
    while (ancestor) ancestor = ancestor.$api.parent();
    return {};
  });
  const errors = computed(() => {
    const current = result();
    return current?.token === token() ? current.errors : [];
  });
  registerExternalValidationErrors(node, {}, errors, {
    onReset: () => {
      resetVersion.update(version => version + 1);
      result.set(undefined);
    },
  });
  return { token, result, begin: () => resetVersion.update(version => version + 1) };
}

function stateFor(node: AnyNode) {
  let state = states.get(node);
  if (!state) {
    state = createState(node);
    states.set(node, state);
  }
  return state;
}

function visit(node: AnyNode, callback: (node: AnyNode) => void) {
  callback(node);
  if (node.$api.nodeType() === 'array') {
    (node as ArrayNode).$api.items().forEach(child => visit(child, callback));
  } else if (node.$api.nodeType() !== 'field') {
    (node as FormNode).$api.forEachChild(child => visit(child, callback), { includeDynamic: true });
  }
}

/** Clear only submission-owned errors before evaluating the next submission's validation gate. */
export function clearSubmissionErrors(node: AnyNode) {
  untracked(() => visit(node, child => states.get(child)?.result.set(undefined)));
}

/** Capture node identities and revisions before application code starts an asynchronous submission. */
export function captureSubmission(node: AnyNode) {
  const snapshots = new WeakMap<AnyNode, object>();
  untracked(() => {
    visit(node, (child) => {
      const state = stateFor(child);
      state.begin();
      snapshots.set(child, state.token());
    });
  });
  return (result: void | null | SubmissionError | readonly SubmissionError[]): boolean => {
    return untracked(() => {
      if (result === null || result === undefined) return true;
      const errors: readonly SubmissionError[] = Array.isArray(result) ? result : [result as SubmissionError];
      const grouped = new Map<AnyNode, SubmissionError[]>();
      for (const error of errors) {
        const target = error.targetNode ?? node;
        const snapshot = snapshots.get(target);
        if (!snapshot || stateFor(target).token() !== snapshot) continue;
        const owned = grouped.get(target) ?? [];
        owned.push({ ...error, targetNode: target });
        grouped.set(target, owned);
      }
      grouped.forEach((owned, target) => {
        const state = stateFor(target);
        state.result.set({ token: state.token(), errors: owned });
      });
      // A rejected submission stays unsuccessful even when every returned error is obsolete.
      return errors.length === 0;
    });
  };
}
