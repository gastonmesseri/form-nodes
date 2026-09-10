import type { Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { useClosestFormState, type ClosestFormState, type CallableNodeApi, type FormApi } from '../../src/public-api';

const state: ClosestFormState = useClosestFormState();
const submitted: Signal<boolean> = state.submitted;
const connected: Signal<boolean> = state.connected;
type _SameFormApi = Expect<Equal<typeof state.formNode, Signal<CallableNodeApi<FormApi<any>> | null>>>;
type _Source = Expect<Equal<ReturnType<typeof state.source>, 'formNode' | 'formGroup' | 'ngForm' | null>>;
const result: Promise<boolean> | undefined = state.formNode()?.submit();
state.formNode()?.reset();
// @ts-expect-error the facade's signal properties cannot be replaced
state.formNode = useClosestFormState().formNode;
// @ts-expect-error submission history is a read-only signal
state.submitted.set(true);
void [submitted, connected, result];
