import { ControlContainer, FormGroupDirective, NgForm, type AbstractControl } from '@angular/forms';
import { DestroyRef, afterEveryRender, assertInInjectionContext, computed, inject, signal, untracked, type Signal } from '@angular/core';

import { FORM_NODE } from './form-node.directive';
import type { FormApi } from '../primitives/form.type';
import type { CallableNodeApi } from '../types/callable-node-api.type';

/** Shared submission state of the form visible through Angular dependency injection. */
export type ClosestFormState = {
  /** Whether a supported form is available. */
  readonly connected: Signal<boolean>;
  /** Active forms API, or null when disconnected. Form Nodes takes precedence. */
  readonly source: Signal<'formNode' | 'formGroup' | 'ngForm' | null>;
  /** Whether the active form has recorded a submission attempt, including an invalid attempt. */
  readonly submitted: Signal<boolean>;
  /** The owning Form Nodes form's callable, collision-safe API; null for Angular forms or no form. */
  readonly formNode: Signal<CallableNodeApi<FormApi<any>> | null>;
};

/**
 * Observes submission state from Form Nodes, Reactive Forms, or template-driven forms.
 *
 * Call in a component or directive injection context. The form owning the nearest FORM_NODE
 * binding takes precedence over Angular's nearest ControlContainer.formDirective. Angular nested
 * groups resolve to their owning NgForm or FormGroupDirective. No DOM ancestor search is performed.
 * Without a supported form, connected and submitted are false and source and formNode are null.
 *
 * formNode exposes the owning form’s callable, collision-safe API, including values and operations.
 * Its signal follows rebinding and model reparenting. A binding without an owning form falls back
 * to the Angular form; it does not search farther FORM_NODE bindings.
 *
 * Angular submission events update immediately. Public control events reconcile submission state
 * in a microtask because resetForm() clears submitted after resetting controls. After-render
 * reconciliation also observes silent resets and replacement controls. Subscriptions are released
 * with the consumer. A late-created consumer reads the current submitted flag immediately.
 *
 * @example
 * const formState = useClosestFormState();
 * const showErrors = computed(() => formState.submitted());
 * // Form Nodes-specific access when available:
 * formState.formNode()?.reset();
 */
export function useClosestFormState(): ClosestFormState {
  assertInInjectionContext(useClosestFormState);
  const binding = inject(FORM_NODE, { optional: true });
  const formNode = computed(() => (binding?.node().$api.form()?.$api ?? null) as CallableNodeApi<FormApi<any>> | null);
  const container = inject(ControlContainer, { optional: true });
  const directive = container?.formDirective;
  const angularForm = directive instanceof NgForm || directive instanceof FormGroupDirective ? directive : null;
  const submitted = signal(untracked(() => angularForm?.submitted ?? false));

  if (angularForm) {
    const destroyRef = inject(DestroyRef);
    let destroyed = false;
    let scheduled = false;
    let control: AbstractControl | null = null;
    let subscription: { unsubscribe(): void } | undefined;
    const capture = () => {
      if (!destroyed) submitted.set(angularForm.submitted);
    };
    const scheduleCapture = () => {
      if (scheduled || destroyed) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        capture();
      });
    };
    const reconcile = () => {
      capture();
      const next = angularForm.control;
      if (control === next) return;
      subscription?.unsubscribe();
      control = next;
      subscription = next?.events.subscribe(scheduleCapture);
    };
    const submitSubscription = angularForm.ngSubmit.subscribe(capture);
    untracked(reconcile);
    afterEveryRender(reconcile);
    destroyRef.onDestroy(() => {
      destroyed = true;
      subscription?.unsubscribe();
      submitSubscription.unsubscribe();
    });
  }

  const source = computed(() => {
    return formNode() ? 'formNode' : angularForm instanceof NgForm ? 'ngForm' : angularForm ? 'formGroup' : null;
  });
  return {
    connected: computed(() => source() !== null),
    source,
    submitted: computed(() => formNode()?.submitted() ?? submitted()),
    formNode,
  };
}
