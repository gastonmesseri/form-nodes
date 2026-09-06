import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { dirname, resolve, relative } from 'node:path';
import linker from '@angular/compiler-cli/linker/babel';
import { build, version as esbuildVersion } from 'esbuild';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const workspace = resolve(import.meta.dirname, '..');
const output = resolve(workspace, 'node_modules/.cache/form-nodes/build-size');
// Use the Babel version owned by the installed Angular compiler.
const compilerRequire = createRequire(import.meta.resolve('@angular/compiler-cli'));
const { transformAsync } = compilerRequire('@babel/core');
const scenarios = ['baseline', 'model', 'binding', 'validators-array'];
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const measure = (bytes) => ({
  raw: bytes.length,
  gzip: gzipSync(bytes, { level: 9 }).length,
  brotli: brotliCompressSync(bytes, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length,
});

rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(resolve(workspace, 'dist'), resolve(output, 'node_modules/@ngblocks/form-nodes'), { recursive: true });
cpSync(resolve(workspace, 'tests/size'), resolve(output, 'fixtures'), { recursive: true });
const config = resolve(output, 'tsconfig.json');
writeFileSync(config, JSON.stringify({
  extends: resolve(workspace, 'tsconfig.json'),
  compilerOptions: {
    rootDir: resolve(output, 'fixtures'),
    outDir: resolve(output, 'compiled'),
    declaration: false,
    sourceMap: false,
    noEmit: false,
  },
  angularCompilerOptions: { compilationMode: 'full' },
  files: scenarios.map((name) => resolve(output, `fixtures/${name}.ts`)),
}, null, 2));
const compilation = spawnSync(process.execPath, [
  resolve(workspace, 'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js'), '-p', config,
], { cwd: workspace, encoding: 'utf8' });
assert.equal(compilation.status, 0, `Size fixtures failed AOT compilation:\n${compilation.stdout}\n${compilation.stderr}`);

const linkedFiles = new Map();
const rows = [];
for (const name of scenarios) {
  const directory = resolve(output, name);
  const result = await build({
    absWorkingDir: workspace,
    entryPoints: [resolve(output, `compiled/${name}.js`)],
    outfile: resolve(directory, 'main.js'),
    alias: { '@ngblocks/form-nodes': resolve(workspace, 'dist/fesm2022/ngblocks-form-nodes.mjs') },
    bundle: true,
    minify: true,
    treeShaking: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2022',
    conditions: ['production'],
    define: { ngDevMode: 'false', ngJitMode: 'false', ngI18nClosureMode: 'false' },
    legalComments: 'none',
    metafile: true,
    plugins: [{
      name: 'angular-production-linker',
      setup(builder) {
        builder.onLoad({ filter: /\.[cm]?js$/ }, async ({ path }) => {
          if (linkedFiles.has(path)) return linkedFiles.get(path);
          const source = readFileSync(path, 'utf8');
          if (!source.includes('ɵɵngDeclare')) return undefined;
          const transformed = await transformAsync(source, {
            filename: path,
            configFile: false,
            babelrc: false,
            plugins: [[linker, { linkerJitMode: false }]],
          });
          assert.ok(transformed?.code, `Linker returned no code for ${path}`);
          const contents = { contents: transformed.code, loader: 'js', resolveDir: dirname(path) };
          linkedFiles.set(path, contents);
          return contents;
        });
      },
    }],
  });
  const bytes = readFileSync(resolve(directory, 'main.js'));
  assert.ok(!bytes.includes('ɵɵngDeclare'), `${name} contains unlinked Angular declarations`);
  const retained = Object.values(result.metafile.outputs).flatMap((file) => {
    return Object.entries(file.inputs).filter(([, data]) => data.bytesInOutput > 0)
      .map(([path, data]) => ({ path, bytes: data.bytesInOutput }));
  }).sort((a, b) => b.bytes - a.bytes);
  const libraryRetained = retained.some(({ path }) => path.endsWith('dist/fesm2022/ngblocks-form-nodes.mjs'));
  assert.equal(libraryRetained, name !== 'baseline', `${name}: unexpected library retention`);
  assert.ok(!retained.some(({ path }) => path.includes('@angular/compiler/')), `${name} includes the JIT compiler`);
  writeFileSync(resolve(directory, 'meta.json'), JSON.stringify(result.metafile, null, 2) + '\n');
  writeFileSync(resolve(directory, 'retained-modules.json'), JSON.stringify(retained, null, 2) + '\n');
  const size = measure(bytes);
  const baseline = rows[0]?.size ?? size;
  rows.push({ name, size, delta: Object.fromEntries(Object.keys(size).map((key) => [key, size[key] - baseline[key]])) });
}
const report = {
  versions: {
    node: process.version,
    angular: readJson(resolve(workspace, 'node_modules/@angular/core/package.json')).version,
    library: readJson(resolve(workspace, 'dist/package.json')).version,
    esbuild: esbuildVersion,
  },
  units: 'bytes',
  compression: { gzipLevel: 9, brotliQuality: 11 },
  scenarios: rows,
};
writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
const lines = [
  '# Build size audit', '',
  `Versions: ${Object.entries(report.versions).map(([key, value]) => `${key} ${value}`).join(', ')}.`, '',
  'Sizes in bytes. Deltas compare each complete application against the baseline.', '',
  '| Scenario | Raw | Gzip | Brotli | Δ raw | Δ gzip | Δ Brotli |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...rows.map(({ name, size, delta }) => `| ${name} | ${size.raw} | ${size.gzip} | ${size.brotli} | ${delta.raw} | ${delta.gzip} | ${delta.brotli} |`),
  '', 'AOT + Angular linker + esbuild; this is a controlled benchmark, not an Angular CLI build.',
  'Includes Angular dependencies. Excludes source maps, types, HTML, CSS, and server compression overhead.',
  'Compression deltas are differences between compressed applications, not independently compressed library sizes.',
  '',
];
writeFileSync(resolve(output, 'report.md'), lines.join('\n'));
console.log(lines.join('\n'));
console.log(`Artifacts: ${relative(workspace, output)}`);
