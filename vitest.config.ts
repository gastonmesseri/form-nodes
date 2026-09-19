import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: [{ find: /^@ngblocks\/form-nodes$/, replacement: new URL('./src/public-api.ts', import.meta.url).pathname }] },
  test: {
    exclude: [...configDefaults.exclude, '**/*.browser.spec.ts', '**/*.production-aot.spec.ts'],
    setupFiles: ['./tests/helpers/setup-angular-jit.ts'],
  },
});
