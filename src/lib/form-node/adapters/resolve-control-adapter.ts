import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import { connectCvaAdapter } from './cva/cva-adapter';
import type { FormNodeControl } from '../form-node-control';
import type { Node, NodeValue } from '../../types/node.type';
import { selectValueAccessor } from './cva/select-value-accessor';
import { isNativeFormNodeControl } from './native/native-control-value';
import { discoverCustomControl } from './custom/discover-custom-control';
import { connectCustomControlAdapter } from './custom/custom-control-adapter';
import { connectNativeControlAdapter } from './native/native-control-adapter';
import { hasControlStateConsumer } from '../../form-node-state/adapters/form-node';
import type { ControlAdapterContext, ControlAdapterConnection } from './control-adapter';

/** Resolves and connects one value transport: direct CVA, provided CVA, custom control, native. */
export const resolveControlAdapter = <TNode extends Node>(
  context: ControlAdapterContext<TNode>,
  directAccessor: ControlValueAccessor | null | undefined,
): ControlAdapterConnection => {
  const { binding } = context;
  const accessor = directAccessor ?? selectValueAccessor(binding.injector.get<readonly ControlValueAccessor[] | null>(NG_VALUE_ACCESSOR, null, { self: true }));
  const control = discoverCustomControl(binding.element);
  if (accessor) return connectCvaAdapter(context, accessor);
  if (control) {
    return connectCustomControlAdapter(control as FormNodeControl<NodeValue<TNode>, TNode>, binding.node, binding.injector, hasControlStateConsumer(binding.element));
  }
  if (isNativeFormNodeControl(binding.element)) return connectNativeControlAdapter(context, binding.element);
  throw new Error('formNode: the host must be a native form control, a recognized signal custom-control component, or provide ControlValueAccessor');
};
