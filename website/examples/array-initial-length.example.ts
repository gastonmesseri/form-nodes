import { array, field, form } from '@ngblocks/form-nodes';

const myForm = form({
  timeseries: array({
    timeseriesCode: field<string>(null),
    value: field(''),
    axis: field('left'),
  }, {
    initialLength: 3,
    configureEach(api) {
      api.children.timeseriesCode.onValueChange(() => {
        api.patch({ value: '', axis: 'left' });
      });
    },
  }),
});

myForm.timeseries.length(); // 3
if (myForm.timeseries.length() !== 3 || myForm.timeseries.at(0) === myForm.timeseries.at(1)) {
  throw new Error('Initial length must create three independent rows.');
}

myForm.timeseries.removeAt(0);
myForm.timeseries.length(); // 2
myForm.resetToInitial();
myForm.timeseries.length(); // 3
if (myForm.timeseries.length() !== 3) {
  throw new Error('Reset to initial must restore the captured initial collection.');
}

// Positional counts and numeric initialValue remain supported.
const positional = array(field(''), 2);
const compatible = array(field(''), { initialValue: 2 });
if (positional.length() !== 2 || compatible.length() !== 2) {
  throw new Error('Existing numeric initialization forms must remain supported.');
}
