import { isDevMode } from '@angular/core';

/** Emits library diagnostics only while Angular development mode is enabled; requires no injector. */
export const warnInDevMode = (message: string) => {
  if (isDevMode()) console.warn(message);
};
