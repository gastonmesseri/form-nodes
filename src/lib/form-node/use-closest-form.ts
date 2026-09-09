import { assertInInjectionContext, computed, inject, type Signal } from '@angular/core';

import { FORM_NODE } from './form-node.directive';
import type { NavigationForm } from '../types/node.type';

/**
 * Returns a signal containing the form that owns the nearest injectable `[formNode]` binding.
 *
 * Call in an Angular injection context, such as a component field initializer. Injection starts
 * on the current element and follows Angular's injector hierarchy. Without a binding, or when
 * the binding's node has no owning `form()`, the signal returns null. A binding to a form returns
 * that form itself; a field, group, or array resolves its nearest form in the model tree.
 *
 * The result tracks binding changes and node reparenting. The injected binding is selected once;
 * this does not scan the DOM for a `<form>`, resolve an HTML `form` attribute, or provide NgForm
 * compatibility. A nearer binding without an owning form does not fall back to farther bindings.
 * Do not read the result in a constructor before the binding's required input is initialized.
 *
 * Use `$api` if child names may shadow methods such as `submitted`.
 *
 * @example
 * ```ts
 * // Component field initializers:
 * closestForm = useClosestForm();
 * showSubmissionErrors = computed(() => this.closestForm()?.$api.submitted() ?? false);
 * ```
 */
export function useClosestForm(): Signal<NavigationForm | null> {
  assertInInjectionContext(useClosestForm);
  const binding = inject(FORM_NODE, { optional: true });
  return computed(() => (binding?.node().$api.form() ?? null) as NavigationForm | null);
}
