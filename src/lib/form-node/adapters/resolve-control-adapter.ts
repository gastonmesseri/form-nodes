import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import type { FormNodeControl } from '../form-node-control';
import type { AnyNode, NodeValue } from '../../types/node.type';
import { connectCvaAdapter } from './control-value-accessor/cva-adapter';
import { isNativeFormNodeControl } from './native-control/native-control-value';
import { hasControlStateConsumer } from '../../form-node-state/adapters/form-node';
import { selectValueAccessor } from './control-value-accessor/select-value-accessor';
import { connectNativeControlAdapter } from './native-control/native-control-adapter';
import { discoverCustomControl } from './signal-forms-control/discover-custom-control';
import type { ControlAdapterContext, ControlAdapterConnection } from './control-adapter';
import { connectCustomControlAdapter } from './signal-forms-control/custom-control-adapter';

/** Resolves and connects one value transport: direct CVA, provided CVA, custom control, native. */
export const resolveControlAdapter = <TNode extends AnyNode>(
  context: ControlAdapterContext<TNode>,
  directAccessor: ControlValueAccessor | null | undefined,
): ControlAdapterConnection => {
  const { binding } = context;
  const accessor = directAccessor ?? selectValueAccessor(binding.injector.get<readonly ControlValueAccessor[] | null>(NG_VALUE_ACCESSOR, null, { self: true }));
  const control = discoverCustomControl(binding.element);
  if (accessor) return connectCvaAdapter(context, accessor);
  if (control) {
    return connectCustomControlAdapter(control as FormNodeControl<NodeValue<TNode>, TNode>, binding.node, binding.injector, hasControlStateConsumer(binding.element), context.receiveValue);
  }
  if (isNativeFormNodeControl(binding.element)) return connectNativeControlAdapter(context, binding.element);
  throw new Error('formNode: the host must be a native form control, a recognized signal custom-control component, or provide ControlValueAccessor');
};
