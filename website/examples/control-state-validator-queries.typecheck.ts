import { computed } from '@angular/core';
import { Validators } from '@angular/forms';
import { required, type ControlState } from '@ngblocks/form-nodes';

// Reusable state logic for a custom control, called with useControlState().
export function observeValidatorRules(state: ControlState, registeredRule: unknown) {
  return {
    // A configured errors callback also counts, even when it currently returns no errors.
    hasValidators: state.hasValidators,
    // Preserve the distinction between false (none) and undefined (unknown).
    validationKnown: computed(() => state.hasValidators() !== undefined),
    // These two queries express the same required-state check for every supported binding.
    requiredViaAngular: computed(() => state.hasValidator(Validators.required)),
    requiredViaFormNodes: computed(() => state.hasValidator(required)),
    // Other functions use registration identity where the active forms API supports it.
    registered: computed(() => state.hasValidator(registeredRule)),
    // Resolves compositions for [formNode]; Angular bindings keep their existing query behavior.
    resolved: computed(() => state.hasValidator(registeredRule, { resolve: true })),
  };
}
