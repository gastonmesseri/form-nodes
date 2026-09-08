import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';

const ngc = join(process.cwd(), 'node_modules', '@angular', 'compiler-cli', 'bundles', 'src', 'bin', 'ngc.js');
const fixtures = [
  { file: 'valid.template.ts', shouldCompile: true },
  { file: 'invalid-committed-output.template.ts', shouldCompile: false, code: 'TS2339', diagnostic: "Property 'toUpperCase' does not exist on type 'number'" },
  { file: 'invalid-control-output.template.ts', shouldCompile: false, code: 'TS2339', diagnostic: "Property 'toUpperCase' does not exist on type 'number'" },
  { file: 'invalid-value.template.ts', shouldCompile: false, code: 'TS2322', diagnostic: "is not assignable to type 'AnyNode'" },
  { file: 'invalid-dynamic-property.template.ts', shouldCompile: false, code: 'TS2339', diagnostic: "Property 'mistypedName' does not exist" },
];
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'form-nodes-template-types-'));

try {
  for (const [index, fixture] of fixtures.entries()) {
    const config = join(temporaryDirectory, `tsconfig.${index}.json`);
    writeFileSync(config, JSON.stringify({
      extends: resolve('tests/types/templates/tsconfig.base.json'),
      files: [resolve('tests/types/templates', fixture.file)],
    }));
    const result = spawnSync(process.execPath, [ngc, '-p', config], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    const compiled = result.status === 0;
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    const hasExpectedDiagnostic = fixture.shouldCompile
      || (output.includes(fixture.code) && output.includes(fixture.diagnostic));
    if (compiled === fixture.shouldCompile && hasExpectedDiagnostic) continue;

    const expectation = fixture.shouldCompile ? 'compile successfully' : 'fail template type checking';
    throw new Error(`${fixture.file} was expected to ${expectation}.\n${output}`);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log(`Template type checking passed for ${fixtures.length} fixtures.`);
