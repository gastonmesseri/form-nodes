import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';

const workspace = resolve(import.meta.dirname, '..');
const [major, ...extra] = process.argv.slice(2);
if (!['21', '22'].includes(major) || extra.length) {
  throw new Error('Usage: npm run test:ui:compatibility -- <21|22>');
}
const directory = mkdtempSync(join(tmpdir(), `form-nodes-ui-${major}-`));
const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: directory, encoding: 'utf8', env: process.env, maxBuffer: 20 * 1024 * 1024 });
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
  process.stdout.write(output);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed (exit ${result.status}).`);
  return output;
};
try {
  cpSync(join(workspace, 'tests/compatibility', `ui-angular-${major}`), directory, { recursive: true });
  for (const name of ['src', 'tests/helpers', 'tests/integration', 'tsconfig.json', 'vitest.ui-compatibility.config.ts']) {
    cpSync(join(workspace, name), join(directory, name), { recursive: true });
  }
  run('npm', ['ci', '--ignore-scripts', '--strict-peer-deps', '--no-audit', '--no-fund']);
  run(process.execPath, ['node_modules/playwright/cli.js', 'install', 'chromium']);
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  for (const [name, expected] of Object.entries(manifest.devDependencies)) {
    const actual = JSON.parse(readFileSync(join(directory, 'node_modules', name, 'package.json'), 'utf8')).version;
    // Exact versions are required for the framework and UI suites; tooling may use a range.
    if (!/^[~^]/.test(expected) && actual !== expected) throw new Error(`${name}: expected ${expected}, got ${actual}.`);
    console.log(`${name}: ${actual}`);
  }
  const output = run(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.ui-compatibility.config.ts', '--no-color']);
  if (!/Tests\s+[1-9]\d* passed/.test(output) || !/Test Files\s+[1-9]\d* passed/.test(output)) {
    throw new Error('UI compatibility must discover and pass real browser tests.');
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
