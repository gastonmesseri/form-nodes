import { InjectionToken } from '@angular/core';

import type { AnyNode } from '../../types/node.type';
import type { FormNodeBinding } from '../../types/form-node-binding.type';

/** Public injection token for the nearest Form Nodes control binding. */
export const FORM_NODE = new InjectionToken<FormNodeBinding<AnyNode>>('FORM_NODE');
