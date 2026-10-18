import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      // CQ08: cobertura medida na camada de lógica de negócio (classes Apl...)
      // e nas regras de segurança (guards de token, PAPEL e TCLE) – PB10.
      include: [
        'src/**/*.service.ts',
        'src/**/guards.ts',
        'src/**/*.guard.ts',
        'src/auth/jwt.config.ts',
      ],
      reporter: ['text', 'json-summary', 'html', 'lcov'],
      thresholds: { lines: 60 },
    },
  },
});
