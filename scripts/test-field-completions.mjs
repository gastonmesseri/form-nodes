import ts from 'typescript';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const workspace = process.cwd();
const packaged = process.argv.includes('--package');
const entry = packaged
  ? `../../dist/${JSON.parse(readFileSync(resolve('dist/package.json'), 'utf8')).typings}`
  : '../../src/public-api';
const file = resolve('tests/types/field-completions.virtual.ts');
let source = `import { field, form, array, createFormPrimitives, type FieldNode, type AnyNode } from '${entry}';
type IborCode = 'DAILY' | 'MONTHLY' | null;
const nullable = createFormPrimitives({ nullable: true });
const strict = createFormPrimitives({ nullable: false });
`;
const positions = [];
const factories = [
  'field', 'field.nullable', 'field.strict',
  'nullable.field', 'nullable.field.nullable', 'nullable.field.strict',
  'strict.field', 'strict.field.nullable', 'strict.field.strict',
];
for (const factory of factories) {
  const generic = factory.endsWith('.strict') || factory === 'strict.field' ? 'Exclude<IborCode, null>' : 'IborCode';
  for (const quote of ["'", '"']) {
    for (const args of ['', ', {}', ', [], {}']) {
      source += `${factory}<${generic}>(${quote}`;
      positions.push({ position: source.length, label: `${factory} with ${args || 'no options'} and ${quote}` });
      source += `${quote}${args});\n`;
    }
  }
}
source += `
const myFieldNodeTyped: FieldNode = field('');
const typedField: FieldNode<string> = field.strict('');
const inferredField = field('');
const profile = form({ name: field(''), address: { city: field('') } });
const names = array(field(''));
const generic: AnyNode = profile;
`;
const memberPositions = [];
for (const node of ['myFieldNodeTyped', 'typedField', 'inferredField', 'profile', 'profile.address', 'names', 'generic.$api']) {
  for (const suffix of ['value', 'value.committed', 'value.control']) {
    source += `${node}.${suffix}.`;
    memberPositions.push({ position: source.length, label: `${node}.${suffix}`, expected: suffix === 'value' ? ['committed', 'control'] : ['set'] });
    source += ';\n';
  }
}
const options = { strict: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true };
const host = {
  getScriptFileNames: () => [file],
  getScriptVersion: () => '0',
  getScriptSnapshot: (name) => {
    const text = name === file ? source : ts.sys.readFile(name);
    return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
  },
  getCurrentDirectory: () => workspace,
  getCompilationSettings: () => options,
  getDefaultLibFileName: ts.getDefaultLibFilePath,
  fileExists: name => name === file || ts.sys.fileExists(name),
  readFile: name => name === file ? source : ts.sys.readFile(name),
  readDirectory: ts.sys.readDirectory,
};
const service = ts.createLanguageService(host);
try {
  for (const { position, label } of positions) {
    const completion = service.getCompletionsAtPosition(file, position, {
      triggerCharacter: source[position - 1],
      triggerKind: ts.CompletionTriggerKind.TriggerCharacter,
    });
    assert.deepEqual(completion?.entries.map(entry => entry.name).sort(), ['DAILY', 'MONTHLY'], label);
  }
  for (const { position, label, expected } of memberPositions) {
    const completion = service.getCompletionsAtPosition(file, position, {
      triggerCharacter: '.',
      triggerKind: ts.CompletionTriggerKind.TriggerCharacter,
    });
    assert.deepEqual(completion?.entries.map(entry => entry.name).sort(), expected, label);
  }
} finally {
  service.dispose();
}
console.log(`Field literal completions passed for ${positions.length} cases against ${packaged ? 'published declarations' : 'source declarations'}.`);

console.log(`Node value member completions passed for ${memberPositions.length} cases against ${packaged ? 'published declarations' : 'source declarations'}.`);
