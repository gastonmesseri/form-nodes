import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const workspace = resolve(import.meta.dirname, '..');
const [major, tarballArgument, ...extraArguments] = process.argv.slice(2);
if (!['21', '22'].includes(major) || extraArguments.length > 0) {
  throw new Error('Usage: node scripts/test-angular-compatibility.mjs <21|22> [package.tgz]');
}

const temporaryDirectory = mkdtempSync(join(tmpdir(), `form-nodes-angular-${major}-`));
const failures = [];
const run = (command, args, required = true) => {
  const result = spawnSync(command, args, {
    cwd: temporaryDirectory,
    encoding: 'utf8',
    env: process.env,
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  if (output) console.log(output);
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const message = `${command} ${args.join(' ')} failed (exit ${result.status}, signal ${result.signal}).`;
    if (required) throw new Error(message);
    failures.push(message);
  }
  return result.stdout;
};

try {
  console.log(`Consumer runtime: Node.js ${process.version}`);
  let tarball = tarballArgument ? resolve(tarballArgument) : undefined;
  if (!tarball) {
    const packed = JSON.parse(run('npm', ['pack', resolve(workspace, 'dist'), '--json', '--ignore-scripts']));
    if (packed.length !== 1 || !packed[0].filename) throw new Error('Expected exactly one packed library.');
    tarball = join(temporaryDirectory, packed[0].filename);
  }

  cpSync(resolve(workspace, 'tests/compatibility', `angular-${major}`), temporaryDirectory, { recursive: true });
  cpSync(resolve(workspace, 'tests/integration/package-consumer.ts'), join(temporaryDirectory, 'package-consumer.ts'));
  cpSync(resolve(workspace, 'tests/compatibility/runtime.mjs'), join(temporaryDirectory, 'runtime.mjs'));
  run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund']);

  const installArguments = ['install', tarball, '--no-save', '--package-lock=false', '--ignore-scripts', '--no-audit', '--no-fund'];
  installArguments.push('--strict-peer-deps');
  run('npm', installArguments);

  const consumer = JSON.parse(readFileSync(join(temporaryDirectory, 'package.json'), 'utf8'));
  for (const [name, expected] of Object.entries(consumer.devDependencies)) {
    const installed = JSON.parse(readFileSync(join(temporaryDirectory, 'node_modules', name, 'package.json'), 'utf8')).version;
    if (installed !== expected) throw new Error(`${name}: expected ${expected}, installed ${installed}.`);
    console.log(`${name}: ${installed}`);
  }

  writeFileSync(join(temporaryDirectory, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ES2022',
      moduleResolution: 'bundler',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      experimentalDecorators: true,
    },
    angularCompilerOptions: {
      strictTemplates: true,
      strictInjectionParameters: true,
      strictInputAccessModifiers: true,
    },
    files: ['./package-consumer.ts'],
  }, null, 2));

  console.log('Checking the packed public API and Angular templates in package-consumer.ts.');
  run(process.execPath, ['node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js', '-p', 'tsconfig.json'], false);
  console.log('Running three packed-package runtime smoke tests.');
  const runtimeOutput = run(process.execPath, ['--test', '--test-reporter=tap', 'runtime.mjs'], false);
  if (!/^# tests 3$/m.test(runtimeOutput) || !/^# pass 3$/m.test(runtimeOutput)) {
    failures.push('Expected exactly three passing runtime smoke tests.');
  }
  if (failures.length > 0) throw new Error(failures.join('\n'));
  console.log(`Angular ${major} package consumer checks passed (one template fixture, three runtime tests).`);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
