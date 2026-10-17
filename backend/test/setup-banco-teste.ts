import { DataSource } from 'typeorm';
import { opcoesBanco } from '../src/database/data-source.js';

/**
 * Global setup dos testes de integração/e2e: recria o banco `mind_test`
 * do zero aplicando todas as migrations (ambiente limpo a cada execução).
 */
export default async function setup(): Promise<void> {
  const nomeBanco = process.env.DB_NAME_TEST ?? 'mind_test';
  if (!nomeBanco.endsWith('_test')) {
    throw new Error(`Recusando recriar o banco "${nomeBanco}": use um banco *_test.`);
  }
  const fonte = new DataSource(
    opcoesBanco({ ...process.env, DB_NAME: nomeBanco }),
  );
  await fonte.initialize();
  await fonte.dropDatabase();
  await fonte.runMigrations();
  await fonte.destroy();
}
