import type { DestroyRef, Renderer2 } from '@angular/core';

import type { NativeControlEvents } from '../control-adapter';
import { isNativeFormNodeControl } from './native-control-value';

const eventNames = ['input', 'change', 'blur', 'compositionstart', 'compositionend'] as const;

/**
 * Reserves native DOM listener order during directive construction, before template listeners.
 * Initialization connects the selected native adapter or removes the listeners for other transports.
 * Renderer listeners deliberately avoid subscribing to same-named Angular component outputs.
 */
export const prepareNativeControlEvents = (element: HTMLElement, renderer: Renderer2, destroyRef: DestroyRef) => {
  if (!isNativeFormNodeControl(element)) return (_events?: NativeControlEvents) => {};
  let events: NativeControlEvents | undefined;
  const cleanups = eventNames.map(name => renderer.listen(element, name, () => events?.[name]()));
  const disconnect = () => {
    events = undefined;
    cleanups.splice(0).forEach(cleanup => cleanup());
  };
  destroyRef.onDestroy(disconnect);
  return (handlers?: NativeControlEvents) => {
    if (handlers) events = handlers;
    else disconnect();
  };
};
