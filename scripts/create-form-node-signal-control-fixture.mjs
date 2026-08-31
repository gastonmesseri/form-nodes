import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';

const workspace = process.cwd();
const outputDirectory = resolve(workspace, 'node_modules', '.cache', 'ng-forms', 'aot-signal-control');
const config = resolve(outputDirectory, 'tsconfig.json');
const ngc = resolve(workspace, 'node_modules', '@angular', 'compiler-cli', 'bundles', 'src', 'bin', 'ngc.js');
const esbuild = resolve(workspace, 'node_modules', '.bin', 'esbuild');

rmSync(outputDirectory, { recursive: true, force: true });
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(config, JSON.stringify({
  extends: resolve(workspace, 'tsconfig.json'),
  compilerOptions: {
    declaration: false,
    declarationMap: false,
    noEmit: false,
    outDir: outputDirectory,
    rootDir: workspace,
    sourceMap: false,
  },
  angularCompilerOptions: {
    compilationMode: 'full',
  },
  files: [resolve(workspace, 'integration-tests', 'form-node-signal-control.fixture.ts')],
}));

const result = spawnSync(process.execPath, [ngc, '-p', config], {
  cwd: workspace,
  encoding: 'utf8',
});

if (result.status !== 0) {
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  throw new Error(`AOT signal-control fixture compilation failed.\n${output}`);
}

const compiledFixture = resolve(outputDirectory, 'integration-tests', 'form-node-signal-control.fixture.js');
const bundledFixture = resolve(outputDirectory, 'form-node-signal-control.fixture.mjs');
const bundleResult = spawnSync(esbuild, [
  compiledFixture,
  '--bundle',
  '--external:@angular/*',
  '--format=esm',
  '--platform=neutral',
  `--outfile=${bundledFixture}`,
], {
  cwd: workspace,
  encoding: 'utf8',
});

if (bundleResult.status !== 0) {
  const output = [bundleResult.stdout, bundleResult.stderr].filter(Boolean).join('\n').trim();
  throw new Error(`AOT signal-control fixture bundling failed.\n${output}`);
}
