import { field, form, group, array, createFormPrimitives, provideFormNodesConfig, configureGlobalFormNodes, type SyncInputs, type SyncInputName } from '../../src/public-api';

const inputs = ['disabled', 'dirty'] as const satisfies readonly SyncInputName[];
const selection = { inputs, target: 'all' } as const satisfies SyncInputs;
field('', { syncInputs: inputs });
form({}, { syncInputs: selection });
group({}, { syncInputs: [] });
array(field(''), { syncInputs: { inputs: 'declared' } });
createFormPrimitives({ syncInputs: selection });
provideFormNodesConfig({ syncInputs: inputs });
configureGlobalFormNodes({ syncInputs: selection });

// @ts-expect-error Only recognized state and constraint inputs can be selected.
field('', { syncInputs: ['disabeld'] });
// @ts-expect-error Value transport is not an optional state input.
provideFormNodesConfig({ syncInputs: ['value'] });
// @ts-expect-error Checkbox transport is not an optional state input.
configureGlobalFormNodes({ syncInputs: { inputs: ['checked'] } });
// @ts-expect-error Targets must name a supported adapter category.
field('', { syncInputs: { inputs, target: 'native' } });

const signalControls = 'signal-controls' satisfies SyncInputs;
field('', { syncInputs: signalControls });
form({}, { syncInputs: signalControls });
group({}, { syncInputs: signalControls });
array(field(''), { syncInputs: signalControls });
createFormPrimitives({ syncInputs: signalControls });
provideFormNodesConfig({ syncInputs: signalControls });
configureGlobalFormNodes({ syncInputs: signalControls });

field('', { bindInputOutputPairs: true, syncInputs: { inputs: 'declared', target: 'cva' } });
form({}, { bindInputOutputPairs: null });
group({}, { bindInputOutputPairs: false });
array(field(''), { bindInputOutputPairs: true });
createFormPrimitives({ bindInputOutputPairs: true });
provideFormNodesConfig({ bindInputOutputPairs: true });
configureGlobalFormNodes({ bindInputOutputPairs: true });
