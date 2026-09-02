import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '**/*.browser.spec.ts'],
    setupFiles: ['./tests/helpers/setup-angular-jit.ts'],
  },
});
