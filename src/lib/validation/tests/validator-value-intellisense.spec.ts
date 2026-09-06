import ts from 'typescript';
import { expect, it } from 'vitest';

it('displays inline validator values like the owning node value signal', () => {
  const directory = ts.sys.getCurrentDirectory();
  const fixture = `${directory}/tests/validator-value-hover.ts`;
  const config = ts.readConfigFile(`${directory}/tsconfig.json`, ts.sys.readFile);
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, directory).options;
  const read = 'ctx.value(); ctx.field().value(); ctx.node().value();';
  const primitives = ['form', 'group', 'array', 'configured.form', 'configured.group', 'configured.array'];
  const source = `
    import { field, form, group, array, validator, asyncValidator, createFormPrimitives } from '../src/public-api';
    const configured = createFormPrimitives({ nullable: false });
    const definition = { subField: 2, subGroup: { username: field(''), email: field('') } };
    ${primitives.map((primitive) => {
    return `
      ${primitive}(definition, [(ctx) => { ${read} return null; }]);
      ${primitive}(definition, { validators: validator((ctx) => { ${read} return null; }) });
      ${primitive}(definition, [asyncValidator(async (ctx) => { ${read} return null; }, {
        when: (ctx) => { ${read} return true; },
        onError: (_error, ctx) => { ${read} return null; },
      })]);
      ${primitive}(definition, { validators: asyncValidator({
        params: (ctx) => { ${read} return ctx.value(); },
        validate: async (ctx) => { ${read} return null; },
      }) });
    `;
  }).join('\n')}
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
    },
    )).toEqual([]);
    const reads = [...source.matchAll(/ctx\.value\(\); ctx\.field\(\)\.value\(\); ctx\.node\(\)\.value\(\);/g)];
    expect(reads).toHaveLength(primitives.length * 7);
    for (const match of reads) {
      const hovers = [...match[0].matchAll(/\bvalue\b/g)].map((member) => {
        const info = service.getQuickInfoAtPosition(fixture, match.index + member.index);
        expect(info).toBeDefined();
        return ts.displayPartsToString(info!.displayParts);
      });
      expect(hovers[0]).toBe(hovers[1]);
      expect(hovers[0]).toBe(hovers[2]);
      expect(hovers[0]).toContain('subField: number');
      expect(hovers[0]).toContain('username: string | null');
    }
  } finally {
    service.dispose();
  }
}, 30_000);
