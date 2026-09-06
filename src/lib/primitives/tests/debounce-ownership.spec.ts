import { build } from 'esbuild';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

describe('pending control debounce ownership', () => {
  it.each([false, true])('releases unreachable trees and completes live work with useDefineForClassFields=%s', async (useDefineForClassFields) => {
    const directory = await mkdtemp(join(tmpdir(), 'gem-debounce-ownership-'));
    const output = join(directory, 'fixture.mjs');
    try {
      await build({
        entryPoints: [fileURLToPath(new URL('./debounce-ownership.fixture.ts', import.meta.url))],
        outfile: output,
        bundle: true,
        platform: 'node',
        format: 'esm',
        logLevel: 'silent',
        tsconfigRaw: { compilerOptions: { useDefineForClassFields, experimentalDecorators: true } },
      });
      const result = execFileSync(process.execPath, ['--expose-gc', output], { encoding: 'utf8', timeout: 15_000 });
      expect(result.trim()).toBe('Debounce ownership and live-node completion passed.');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 20_000);
});
