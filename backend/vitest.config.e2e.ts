import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Testes de integração (*.int-spec.ts) e ponta a ponta (*.e2e-spec.ts).
// Usam o banco PostgreSQL `mind_test` (docker compose up -d), recriado no globalSetup.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts', '**/*.int-spec.ts'],
    env: { DB_NAME: process.env.DB_NAME_TEST ?? 'mind_test' },
    globalSetup: ['./test/setup-banco-teste.ts'],
    fileParallelism: false,
  },
});
