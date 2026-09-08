import type { Renderer2 } from '@angular/core';

import type { AnyNode } from '../../types/node.type';
import type { FormNodeNgControl } from '../form-node-ng-control';
import type { FormNodeBinding } from '../../types/form-node-binding.type';

/** Shared host services; adapters own their transport state and injector-scoped cleanup. */
export type ControlAdapterContext<TNode extends AnyNode = AnyNode> = {
  binding: FormNodeBinding<TNode>;
  renderer: Renderer2;
  getNgControl(): FormNodeNgControl;
};

/** Capabilities returned after a control transport has been connected. */
export type ControlAdapterConnection = {
  focus?: (options?: FocusOptions) => void;
  inputNames: ReadonlySet<string>;
};
