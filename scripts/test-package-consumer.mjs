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
  if (!packedPaths.has('AGENTS.md')) {
    throw new Error('The published package does not contain its consumer agent guide.');
  }
  if ([...packedPaths].some((path) => path.startsWith('src/'))) {
    throw new Error('The published package unexpectedly contains library source files.');
  }

  const packageDirectory = join(temporaryDirectory, 'node_modules', '@ngblocks', 'form-nodes');
  mkdirSync(packageDirectory, { recursive: true });
  run('tar', ['-xzf', join(temporaryDirectory, packed.filename), '--strip-components=1', '-C', packageDirectory]);
  const consumerGuide = readFileSync(resolve(workspace, 'docs/consumer/AGENTS.md'), 'utf8');
  if (readFileSync(join(packageDirectory, 'AGENTS.md'), 'utf8') !== consumerGuide) {
    throw new Error('The published agent guide must match the consumer guide rather than contributor instructions.');
  }
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
  for (const dependency of ['common', 'compiler', 'core', 'forms', 'platform-browser']) {
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
  // The primary entry point above executes without Angular Router installed in the consumer.
  if (!packageManifest.exports['./router']) throw new Error('The router entry point is missing.');
  if (!packageManifest.peerDependenciesMeta?.['@angular/router']?.optional) throw new Error('Angular Router must remain an optional peer.');
  symlinkSync(resolve(workspace, 'node_modules/@angular/router'), join(angularDirectory, 'router'), 'dir');
  writeFileSync(join(temporaryDirectory, 'package-consumer.ts'), source + `
    import { syncQueryParams, queryParam, type QueryParamsSync, type QueryParamBinding, type QueryParamUrlSyncEvent, type QueryParamSerializer, type QueryParamCodec } from '@ngblocks/form-nodes/router';
    import { signal as querySignal } from '@angular/core';
    const queryField = field(1);
    const objectCodec: QueryParamSerializer<number> = queryParam.integer();
    const legacyCodec: QueryParamCodec<number> = objectCodec;
    objectCodec.parse(['2']);
    const queryBinding: QueryParamBinding<number | null> = { source: queryField, serializer: 'integer', defaultValue: 1 };
    function connectQueryParameters() {
      const sync = syncQueryParams({ page: queryBinding, tag: { source: field.strict<string[]>([]), serializer: 'array' }, active: { source: field(false), serializer: 'boolean' }, state: { source: field.strict({ ids: [1, 2] }), serializer: 'json' } });
      const mixed = syncQueryParams({
        page: { source: querySignal(1), serializer: 'integer', defaultValue: 1 },
        profile: { source: form({ name: field('') }), serializer: 'json' },
        tags: { source: array(field.strict('')), serializer: 'array' },
        group: { source: group({ active: field(false) }), serializer: 'json' },
      }, {
        onInitialUrlSync(event) {
          const initial: 'initial' = event.reason;
          const page: number = event.values.page;
          void [initial, page];
        },
        onUrlSync(event) {
          const snapshot: QueryParamUrlSyncEvent<{ page: number }> = event;
          const name: string | null = event.values.profile.name;
          void [snapshot, name];
        },
      });
      syncQueryParams({ legacyPage: { source: querySignal(1), codec: legacyCodec } });
      const rawProfile: string | null = mixed.params.profile();
      void rawProfile;
      const typed: QueryParamsSync<'page'> = sync;
      const raw: string | null = sync.params.page();
      const rawTag: string | null = sync.params.tag();
      const pending: boolean = sync.pending();
      const closed: boolean = sync.closed();
      sync.unsubscribe();
      return { typed, raw, rawTag, pending, closed };
    }
  `);
  run(process.execPath, [ngc, '-p', join(temporaryDirectory, 'tsconfig.json')]);
  writeFileSync(join(temporaryDirectory, 'router-runtime.mjs'), `
    import '@angular/compiler';
    import { queryParam } from '@ngblocks/form-nodes/router';
    if (queryParam.integer().parse(['2']) !== 2) throw new Error('Published router serializers do not work.');
    if (queryParam.array().parse(['a', 'b']).length !== 2) throw new Error('Published array serializer does not work.');
    if (queryParam.json().parse(['{"id":1}']).id !== 1) throw new Error('Published JSON serializer does not work.');
  `);
  run(process.execPath, [join(temporaryDirectory, 'router-runtime.mjs')]);

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
