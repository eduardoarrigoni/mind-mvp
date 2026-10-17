import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ENTIDADES } from './entidades.js';
import { MIGRACOES } from './migrations/index.js';

/**
 * Opções únicas de conexão, usadas pela aplicação Nest, pela CLI do TypeORM
 * e pelos testes. Os padrões batem com o docker-compose.yml da raiz.
 * O esquema é criado SOMENTE por migrations (synchronize: false).
 */
export function opcoesBanco(
  env: NodeJS.ProcessEnv = process.env,
): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER ?? 'mind',
    password: env.DB_PASSWORD ?? 'mind',
    database: env.DB_NAME ?? 'mind',
    entities: ENTIDADES,
    migrations: MIGRACOES,
    uuidExtension: 'pgcrypto',
    synchronize: false,
    migrationsRun: false,
  };
}

// Instância usada pela CLI: `typeorm -d dist/database/data-source.js ...`
export default new DataSource(opcoesBanco());
