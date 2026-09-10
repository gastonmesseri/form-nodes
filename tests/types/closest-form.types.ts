import type { Signal } from '@angular/core';

import type { Equal, Expect } from './assert.types';
import { form, field, group, array, useClosestFormState, type FormNode } from '../../src/public-api';

const profile = form({ name: field('Ada') });
const submitted: Signal<boolean> = profile.submitted;
type _Submitted = Expect<Equal<ReturnType<typeof profile.submitted>, boolean>>;
const generic: FormNode = profile;
const genericSubmitted: Signal<boolean> = generic.$api.submitted;
const closest = useClosestFormState().formNode;
const closestSubmitted: boolean | undefined = closest()?.submitted();
const submittedAction: Promise<boolean> | undefined = closest()?.submit();
// @ts-expect-error submitted is a readonly signal
profile.submitted.set(true);
// @ts-expect-error groups have no independent submission history
const groupSubmitted = group({}).submitted;
// @ts-expect-error fields use their owner form's history
const fieldSubmitted = field('').submitted;
// @ts-expect-error arrays use their owner form's history
const arraySubmitted = array(field('')).submitted;
void [submitted, genericSubmitted, closestSubmitted, submittedAction, groupSubmitted, fieldSubmitted, arraySubmitted];
