import { tmpdir } from 'node:os';
import { buildSync } from 'esbuild';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readdirSync, rmSync, mkdtempSync } from 'node:fs';

const websiteDirectory = resolve(import.meta.dirname, '..');
const repositoryDirectory = resolve(websiteDirectory, '..');
const examplesDirectory = resolve(websiteDirectory, 'examples');
const angularCompiler = resolve(repositoryDirectory, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js');

const typecheck = spawnSync(process.execPath, [angularCompiler, '--project', resolve(websiteDirectory, 'tsconfig.examples.json')], {
  cwd: repositoryDirectory,
  encoding: 'utf8',
});

if (typecheck.status !== 0) {
  const output = [typecheck.stdout, typecheck.stderr].filter(Boolean).join('\n').trim();
  throw new Error(`Documentation examples failed type checking.\n${output}`);
}

const executableExamples = readdirSync(examplesDirectory)
  .filter(file => file.endsWith('.example.ts'))
  .sort();
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'form-nodes-doc-examples-'));

try {
  for (const file of executableExamples) {
    const outputFile = resolve(temporaryDirectory, `${file}.mjs`);
    buildSync({
      entryPoints: [resolve(examplesDirectory, file)],
      outfile: outputFile,
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'node22',
      alias: {
        'form-nodes': resolve(repositoryDirectory, 'src/public-api.ts'),
      },
      inject: [resolve(import.meta.dirname, 'example-runtime-setup.ts')],
      logLevel: 'silent',
    });

    const execution = spawnSync(process.execPath, [outputFile], {
      cwd: repositoryDirectory,
      encoding: 'utf8',
    });
    if (execution.status === 0) continue;

    const output = [execution.stdout, execution.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`${file} failed during execution.\n${output}`);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log(`Documentation examples passed type checking; ${executableExamples.length} executable examples passed.`);
