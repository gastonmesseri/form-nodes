import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';

const ngc = join(process.cwd(), 'node_modules', '@angular', 'compiler-cli', 'bundles', 'src', 'bin', 'ngc.js');
const fixtures = [
  { file: 'valid.template.ts', shouldCompile: true },
  { file: 'invalid-value.template.ts', shouldCompile: false, diagnostic: "is not assignable to type 'Node'" },
];
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'ng-forms-template-types-'));

try {
  for (const [index, fixture] of fixtures.entries()) {
    const config = join(temporaryDirectory, `tsconfig.${index}.json`);
    writeFileSync(config, JSON.stringify({
      extends: resolve('type-tests/templates/tsconfig.base.json'),
      files: [resolve('type-tests/templates', fixture.file)],
    }));
    const result = spawnSync(process.execPath, [ngc, '-p', config], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    const compiled = result.status === 0;
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    const hasExpectedDiagnostic = fixture.shouldCompile
      || (output.includes('TS2322') && output.includes(fixture.diagnostic));
    if (compiled === fixture.shouldCompile && hasExpectedDiagnostic) continue;

    const expectation = fixture.shouldCompile ? 'compile successfully' : 'fail template type checking';
    throw new Error(`${fixture.file} was expected to ${expectation}.\n${output}`);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log(`Template type checking passed for ${fixtures.length} fixtures.`);
