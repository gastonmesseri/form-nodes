import type { Signal } from '@angular/core';

import type { HiddenFunctionMembers } from './hidden-function-members.type';

/**
 * A collision-safe node API that is also an Angular signal of the exposed node value.
 *
 * Calling it is equivalent to `node()` or `api.value()`: custom equality and debounce retain
 * their normal public-read semantics. Use `api.value.committed()` for raw committed data or
 * `api.value.control()` for pending control input.
 *
 * The API contains state and operations, not direct child properties. Children named `value`,
 * `submitted`, `set`, or `api` cannot replace its members. Native function members are hidden
 * from IntelliSense, except where the API defines a member itself (such as array `length`).
 * It is a signal and an API, not a form-node declaration; `isFormNode(api)` is false.
 *
 * @example
 * ```ts
 * const profile = form({ submitted: field('draft') });
 * profile.$api(); // { submitted: 'draft' }
 * profile.$api.submitted(); // false
 * profile.$api.children.submitted(); // 'draft'
 * ```
 */
export type CallableNodeApi<TApi extends { value: Signal<any> }> =
  & Signal<ReturnType<TApi['value']>>
  & TApi
  & HiddenFunctionMembers<keyof TApi>;
