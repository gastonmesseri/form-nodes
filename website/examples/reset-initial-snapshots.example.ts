import { field, form } from '@ngblocks/form-nodes';

class Selection {
  constructor(public label: string) {}
}

const preferences = { tags: ['initial'], date: new Date('2026-01-01') };
const selection = new Selection('initial');
const profile = form({
  preferences: field.strict(preferences),
  selection: field.strict(selection),
});

// Deliberate in-place mutations demonstrate the snapshot boundary; prefer immutable updates.
preferences.tags.push('mutated');
preferences.date.setUTCFullYear(2030);
selection.label = 'mutated';
profile.resetToInitial();

profile.preferences().tags; // ['initial']
profile.selection().label; // 'mutated'
if (profile.preferences().tags.length !== 1 || profile.preferences().date.getUTCFullYear() !== 2026) {
  throw new Error('Supported data containers should restore independent initial copies.');
}
if (profile.selection() !== selection || profile.selection().label !== 'mutated') {
  throw new Error('Custom instances should retain their references and cannot undo in-place edits.');
}

profile.preferences().tags.push('another mutation');
profile.resetToInitial();
if (profile.preferences().tags.length !== 1) throw new Error('Restored copies must not corrupt the stored baseline.');
