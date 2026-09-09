import { assertInInjectionContext, computed, inject, type Signal } from '@angular/core';

import { FORM_NODE } from './form-node.directive';
import type { FormApi } from '../primitives/form.type';
import type { CallableNodeApi } from '../types/callable-node-api.type';

/**
 * Returns a signal containing the callable, collision-safe API of the form that owns the nearest injectable `[formNode]` binding.
 *
 * Call in an Angular injection context, such as a component field initializer. Injection starts
 * on the current element and follows Angular's injector hierarchy. Without a binding, or when
 * the binding's node has no owning `form()`, the signal returns null. A binding to a form returns
 * that form's API; a field, group, or array resolves its nearest form in the model tree.
 *
 * The result tracks binding changes and node reparenting. The injected binding is selected once;
 * this does not scan the DOM for a `<form>`, resolve an HTML `form` attribute, or provide NgForm
 * compatibility. A nearer binding without an owning form does not fall back to farther bindings.
 * Do not read the result in a constructor before the binding's required input is initialized.
 *
 * The returned API is invocable and its members cannot be shadowed by child names.
 * Read `closestForm()?.()` for its exposed value or `closestForm()?.submitted()` for history.
 *
 * @example
 * ```ts
 * // Component field initializers:
 * closestForm = useClosestForm();
 * showSubmissionErrors = computed(() => this.closestForm()?.submitted() ?? false);
 * ```
 */
export function useClosestForm(): Signal<CallableNodeApi<FormApi<any>> | null> {
  assertInInjectionContext(useClosestForm);
  const binding = inject(FORM_NODE, { optional: true });
  return computed(() => (binding?.node().$api.form()?.$api ?? null) as CallableNodeApi<FormApi<any>> | null);
}
