import type { Renderer2 } from '@angular/core';

import type { AnyNode } from '../../types/node.type';
import type { FormNodeNgControl } from '../form-node-ng-control';
import type { FormNodeBinding } from '../../types/form-node-binding.type';
import type { CustomControlEvents } from './signal-forms-control/custom-control-events';

/** Shared host services; adapters own their transport state and injector-scoped cleanup. */
export type ControlAdapterContext<TNode extends AnyNode = AnyNode> = {
  binding: FormNodeBinding<TNode>;
  renderer: Renderer2;
  getNgControl(): FormNodeNgControl;
  receiveValue(value: unknown): void;
};

/** Native transport callbacks connected only when the native adapter is selected. */
export type NativeControlEvents = {
  input(): void;
  change(): void;
  blur(): void;
  compositionstart(): void;
  compositionend(): void;
};

/** Capabilities returned after a control transport has been connected. */
export type ControlAdapterConnection = {
  nativeEvents?: NativeControlEvents;
  customEvents?: CustomControlEvents;
  focus?: (options?: FocusOptions) => void;
  inputNames: ReadonlySet<string>;
};
