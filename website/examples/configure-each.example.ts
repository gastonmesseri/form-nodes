import { array, field, form } from '@ngblocks/form-nodes';

const myForm = form({
  timeseries: array({
    timeseriesCode: field<string>(null),
    value: field(''),
    axis: field('left'),
  }, {
    initialValue: [
      { timeseriesCode: 'temperature', value: 'average', axis: 'right' },
      { timeseriesCode: 'pressure', value: 'maximum', axis: 'right' },
    ],
    configureEach(api) {
      api.children.timeseriesCode.onValueChange(() => {
        api.patch({ value: '', axis: 'left' });
      });
    },
  }),
});

if (myForm.timeseries.at(0)?.value() !== 'average') {
  throw new Error('Initial data must not trigger the dependent-field reset.');
}

myForm.timeseries.at(0)?.timeseriesCode.set('humidity');
myForm.timeseries.at(0)?.value(); // ''
myForm.timeseries.at(0)?.axis(); // 'left'
myForm.timeseries.at(1)?.value(); // 'maximum'

if (myForm.timeseries.at(0)?.value() !== '' || myForm.timeseries.at(0)?.axis() !== 'left') {
  throw new Error('Changing the code must clear the dependent values in the same row.');
}
if (myForm.timeseries.at(1)?.value() !== 'maximum') {
  throw new Error('Changing one row must preserve its sibling rows.');
}

const added = myForm.timeseries.push({ timeseriesCode: 'wind', value: 'minimum', axis: 'right' });
added.timeseriesCode.set('rain');
if (added.value() !== '' || added.axis() !== 'left') {
  throw new Error('Rows added later must receive the same configuration.');
}
