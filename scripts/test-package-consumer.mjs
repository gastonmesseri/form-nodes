import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'form-nodes-package-consumer-'));

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: temporaryDirectory,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: join(temporaryDirectory, '.npm-cache') },
    ...options,
  });
  if (result.status === 0) return result.stdout.trim();

  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  throw new Error(`${command} ${args.join(' ')} failed.\n${output}`);
};

try {
  const packResult = JSON.parse(run('npm', ['pack', resolve(workspace, 'dist'), '--json']));
  const packed = packResult[0];
  if (!packed?.filename || !Array.isArray(packed.files)) throw new Error('npm pack returned an unexpected result.');
  const packedPaths = new Set(packed.files.map(({ path }) => path));
  if (!packedPaths.has('fesm2022/ngblocks-form-nodes.mjs') || !packedPaths.has('types/ngblocks-form-nodes.d.ts')) {
    throw new Error('The published package does not contain its JavaScript bundle and public typings.');
  }
  if ([...packedPaths].some((path) => path.startsWith('src/'))) {
    throw new Error('The published package unexpectedly contains library source files.');
  }

  const packageDirectory = join(temporaryDirectory, 'node_modules', '@ngblocks', 'form-nodes');
  mkdirSync(packageDirectory, { recursive: true });
  run('tar', ['-xzf', join(temporaryDirectory, packed.filename), '--strip-components=1', '-C', packageDirectory]);
  const packageManifest = JSON.parse(readFileSync(join(packageDirectory, 'package.json'), 'utf8'));
  if (packageManifest.name !== '@ngblocks/form-nodes') {
    throw new Error('The published package must use the @ngblocks/form-nodes name.');
  }
  if (packageManifest.scripts?.prepublishOnly) {
    throw new Error('The published package was compiled in Angular full compilation mode.');
  }
  if (packageManifest.sideEffects !== false) {
    throw new Error('The published package must declare sideEffects: false for consumer tree shaking.');
  }
  if (packageManifest.workspaces !== undefined) {
    throw new Error('The published package unexpectedly contains repository workspace configuration.');
  }

  const angularDirectory = join(temporaryDirectory, 'node_modules', '@angular');
  mkdirSync(angularDirectory, { recursive: true });
  for (const dependency of ['compiler', 'core', 'forms', 'platform-browser']) {
    symlinkSync(resolve(workspace, 'node_modules', '@angular', dependency), join(angularDirectory, dependency), 'dir');
  }

  const source = readFileSync(resolve(workspace, 'tests/integration/package-consumer.ts'), 'utf8');
  writeFileSync(join(temporaryDirectory, 'package-consumer.ts'), source);
  writeFileSync(join(temporaryDirectory, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ES2022',
      moduleResolution: 'bundler',
      lib: ['ES2022', 'DOM'],
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      experimentalDecorators: true,
    },
    angularCompilerOptions: {
      strictTemplates: true,
      strictInjectionParameters: true,
    },
    files: [join(temporaryDirectory, 'package-consumer.ts')],
  }));

  const ngc = resolve(workspace, 'node_modules', '@angular', 'compiler-cli', 'bundles', 'src', 'bin', 'ngc.js');
  run(process.execPath, [ngc, '-p', join(temporaryDirectory, 'tsconfig.json')]);

  writeFileSync(join(temporaryDirectory, 'runtime.mjs'), `
    import '@angular/compiler';
    import { array, createFormPrimitives, field, form, group, required } from '@ngblocks/form-nodes';
    class Company {
      constructor(name) { this.name = name; }
    }
    const configuredForms = createFormPrimitives({ nullable: false });
    const configuredProfile = configuredForms.form({ name: '' });
    if (configuredProfile.name() !== '') throw new Error('Configured form factories were not preserved in the package.');
    const profile = form({
      name: field('', [required]),
      preferences: group({ theme: field('dark') }),
      addresses: array({ city: field('') }, [{ city: 'Zurich' }]),
      roles: ['admin'],
      birthday: new Date('1990-06-15T00:00:00.000Z'),
      company: new Company('Form Nodes'),
      atomicAddress: field({ city: 'Bern' }),
    });
    if (profile.name.valid()) throw new Error('Required validation was not preserved in the package.');
    if (profile.addresses[0].city() !== 'Zurich') throw new Error('Array values were not preserved in the package.');
    if (profile.preferences.theme() !== 'dark') throw new Error('Group values were not preserved in the package.');
    if (profile.roles.nodeType() !== 'field' || profile.roles()[0] !== 'admin') throw new Error('Array-valued field shorthand was not preserved in the package.');
    if (profile.birthday.nodeType() !== 'field' || !(profile.birthday() instanceof Date)) throw new Error('Date field shorthand was not preserved in the package.');
    if (profile.company.nodeType() !== 'field' || !(profile.company() instanceof Company)) throw new Error('Class-instance field shorthand was not preserved in the package.');
    if (profile.atomicAddress.nodeType() !== 'field' || profile.atomicAddress().city !== 'Bern') throw new Error('Explicit atomic object fields were not preserved in the package.');
    const shorthandRows = array({ name: '', age: 0 }, [{ name: 'Marco', age: 36 }]);
    if (shorthandRows[0].name.nodeType() !== 'field' || shorthandRows[0].age() !== 36) throw new Error('Array object-template shorthand was not preserved in the package.');
    const age = profile.add('age', 36);
    const added = profile.preferences.add({ locale: 'en', range: { minimum: 0 } });
    if (age.nodeType() !== 'field' || age() !== 36) throw new Error('Dynamic field shorthand was not preserved in the package.');
    if (added.range.nodeType() !== 'group' || added.range.minimum() !== 0) throw new Error('Dynamic group shorthand was not preserved in the package.');
  `);
  run(process.execPath, [join(temporaryDirectory, 'runtime.mjs')]);

  writeFileSync(join(temporaryDirectory, 'tree-shaking.mjs'), `
    import { required } from '@ngblocks/form-nodes';
    console.log(required);
  `);
  const treeShakenBundle = join(temporaryDirectory, 'tree-shaking-bundle.mjs');
  const esbuild = resolve(workspace, 'node_modules', '.bin', 'esbuild');
  run(esbuild, [
    join(temporaryDirectory, 'tree-shaking.mjs'),
    '--bundle',
    '--format=esm',
    '--platform=browser',
    '--minify',
    '--tree-shaking=true',
    '--external:@angular/*',
    `--outfile=${treeShakenBundle}`,
  ]);
  const treeShakenSource = readFileSync(treeShakenBundle, 'utf8');
  if (!treeShakenSource.includes('This field is required.')) {
    throw new Error('The consumer bundle unexpectedly removed the imported required validator.');
  }
  const unusedValidatorMarkers = [
    'Please ensure every item is unique.',
    'Please enter a date between',
    'Please enter a valid absolute URL.',
    'duplicateIndexes',
    'dateBetween',
  ];
  const retainedMarker = unusedValidatorMarkers.find(marker => treeShakenSource.includes(marker));
  if (retainedMarker !== undefined) {
    throw new Error(`The consumer bundle retained an unused validator marker: ${retainedMarker}`);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

console.log('Built package consumer checks passed.');
