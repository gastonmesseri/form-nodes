import { field, form, group, array, createFormPrimitives, provideFormNodesConfig, configureGlobalFormNodes, type SyncInputs, type SyncInputName } from '../../src/public-api';

const inputs = ['disabled', 'dirty'] as const satisfies readonly SyncInputName[];
const selection = { mode: 'always', inputs } as const satisfies SyncInputs;
field('', { syncInputs: inputs });
form({}, { syncInputs: selection });
group({}, { syncInputs: [] });
array(field(''), { syncInputs: { mode: 'only-declared', inputs: ['required'] } });
createFormPrimitives({ syncInputs: selection });
provideFormNodesConfig({ syncInputs: inputs });
configureGlobalFormNodes({ syncInputs: selection });

// @ts-expect-error Only recognized state and constraint inputs can be selected.
field('', { syncInputs: ['disabeld'] });
// @ts-expect-error Value transport is not an optional state input.
provideFormNodesConfig({ syncInputs: ['value'] });
// @ts-expect-error Checkbox transport is not an optional state input.
configureGlobalFormNodes({ syncInputs: { mode: 'always', inputs: ['checked'] } });
// @ts-expect-error An explicit selection requires a named mode.
field('', { syncInputs: { mode: true, inputs } });
