import { InjectionToken, type Provider } from '@angular/core';

/** @internal Marks a `[formNode]` host as a pass-through binding. */
export const FORM_NODE_PASS_THROUGH = new InjectionToken<boolean>('FORM_NODE_PASS_THROUGH');

/**
 * Makes `[formNode]` passive on a host directive that consumes and delegates the same input.
 * Wrapper components with a public `formNode` input are detected automatically.
 */
export const provideFormNodePassThrough = (): Provider => ({
  provide: FORM_NODE_PASS_THROUGH,
  useValue: true,
});
