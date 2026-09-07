import { computed } from '@angular/core';
import { Validators } from '@angular/forms';
import { required, type ControlState } from '@ngblocks/form-nodes';

// Reusable state logic for a custom control, called with useFormNodeState().
export function observeValidatorRules(state: ControlState, registeredRule: unknown) {
  return {
    // These two queries express the same required-state check for every supported binding.
    requiredViaAngular: computed(() => state.hasValidator(Validators.required)),
    requiredViaFormNodes: computed(() => state.hasValidator(required)),
    // Other functions use registration identity where the active forms API supports it.
    registered: computed(() => state.hasValidator(registeredRule)),
    // Resolves compositions for [formNode]; Angular bindings keep their existing query behavior.
    resolved: computed(() => state.hasValidator(registeredRule, { resolve: true })),
  };
}
