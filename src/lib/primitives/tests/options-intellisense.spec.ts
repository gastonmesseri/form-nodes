import ts from 'typescript';
import { expect, it } from 'vitest';

it('completes option keys without replacing them with function or array members', () => {
  const directory = ts.sys.getCurrentDirectory();
  const fixture = `${directory}/tests/node-options-completions.ts`;
  const config = ts.readConfigFile(`${directory}/tsconfig.json`, ts.sys.readFile);
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, directory).options;
  const common = ['validators', 'disabled', 'readonly', 'hidden', 'debounce', 'equal', 'injector', 'inheritInjector', 'adoptBindingInjector', 'syncInputs', 'bindInputOutputPairs'];
  const declarations = ts.sys.readFile(`${directory}/tests/types/self-referencing-validators.types.ts`)!;
  const completeExample = declarations.slice(declarations.indexOf('const matchedId'), declarations.indexOf('const complete ='));
  const cases = [
    ['field(\'\', { /* options */ })', common],
    ['field<string>(null, { /* options */ })', common],
    ['field(null, { /* options */ })', common],
    ['field(undefined, { /* options */ })', common],
    ['field.strict(\'\', { /* options */ })', common],
    ['field.nullable(\'\', { /* options */ })', common],
    ['field(\'\', [required], { /* options */ })', common],
    ['configured.field(\'\', { /* options */ })', common],
    ['configured.field.strict(\'\', { /* options */ })', common],
    ['configured.field.nullable(\'\', { /* options */ })', common],
    ['form({ name: field(\'\') }, { /* options */ })', [...common, 'onSubmit', 'onSubmitBlocked', 'submitWhen', 'validatorMessages']],
    ['group({ name: field(\'\') }, { /* options */ })', [...common, 'validatorMessages']],
    ['array({ name: field(\'\') }, { /* options */ })', [...common, 'initialValue', 'trackBy', 'validatorMessages']],
    ['configured.form({ name: field(\'\') }, { /* options */ })', [...common, 'onSubmit']],
    ['configured.group({ name: field(\'\') }, { /* options */ })', [...common, 'validatorMessages']],
    ['configured.array({ name: field(\'\') }, { /* options */ })', [...common, 'initialValue', 'trackBy']],
    ['array({ name: field(\'\') }, 1, { /* options */ })', [...common, 'trackBy']],
    ['field(\'\', { disabled: true, /* options */ })', common.filter(key => key !== 'disabled')],
    ['class Model { myForm = form({ valueType: field<number>(null, [required]), value: field(\'\', [() => this.myForm.valueType() ? { kind: \'\' } : null]), other: field(\'\', { /* options */ }) }); }', common],
    [completeExample.replace('some5: field(\'\', {', 'some5: field(\'\', { /* options */'), common.filter(key => key !== 'validators')],
  ] as const;
  const source = `
    import { signal } from '@angular/core';
    import { field, form, group, array, required, validator, asyncValidator, createFormPrimitives } from '../src/public-api';
    const configured = createFormPrimitives({ nullable: false });
    ${cases.map(([expression]) => expression).join(';\n')};
  `;
  const service = ts.createLanguageService({
    getScriptFileNames: () => [fixture],
    getScriptVersion: () => '0',
    getScriptSnapshot: (file) => {
      const text = file === fixture ? source : ts.sys.readFile(file);
      return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
    },
    getCurrentDirectory: () => directory,
    getCompilationSettings: () => options,
    getDefaultLibFileName: ts.getDefaultLibFilePath,
    fileExists: file => file === fixture || ts.sys.fileExists(file),
    readFile: ts.sys.readFile,
  });

  try {
    expect(service.getSemanticDiagnostics(fixture).map((diagnostic) => {
      return ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    })).toEqual([]);
    const markers = [...source.matchAll(/\/\* options \*\//g)];
    expect(markers).toHaveLength(cases.length);
    for (const [index, marker] of markers.entries()) {
      const [expression, expected] = cases[index]!;
      const completion = service.getCompletionsAtPosition(fixture, marker.index, {});
      const names = completion?.entries.map(entry => entry.name) ?? [];
      expect(names, expression).toEqual(expect.arrayContaining([...expected]));
      for (const unrelated of ['length', 'map', 'call', 'apply']) expect(names, expression).not.toContain(unrelated);
      expect(completion?.isGlobalCompletion, expression).toBe(false);
      if (expression.includes('disabled: true')) expect(names).not.toContain('disabled');
    }
  } finally {
    service.dispose();
  }
}, 30_000);
