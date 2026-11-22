import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'html', 'lcov'],
      // Target from §8: ≥ 85% for Domain/ and Application/; elsewhere, as much as needed.
      thresholds: {
        'src/Domain/**': { lines: 85, functions: 85, branches: 85, statements: 85 },
        'src/Application/**': { lines: 85, functions: 85, branches: 85, statements: 85 },
      },
    },
  },
});
