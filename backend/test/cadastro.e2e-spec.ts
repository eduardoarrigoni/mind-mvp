import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar-app.js';

describe('POST /auth/cadastro (e2e – UC01)', () => {
  let app: INestApplication;
  let fonte: DataSource;

  const valido = {
    nome: 'Carlos Pereira',
    email: 'carlos@mind.app',
    dataNascimento: '1999-08-20',
    senha: 'umaSenhaBoa1',
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configurarApp(modulo.createNestApplication());
    await app.init();
    fonte = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await fonte.query('TRUNCATE TABLE "usuario" CASCADE');
  });

  it('201: cria o paciente e não retorna a senha', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/cadastro')
      .send(valido)
      .expect(201);

    expect(res.body).toMatchObject({
      nome: 'Carlos Pereira',
      email: 'carlos@mind.app',
      papel: 'PACIENTE',
      dataNascimento: '1999-08-20',
    });
    expect(res.body.id).toBeDefined();
    expect(res.body).not.toHaveProperty('senha');
    expect(res.body).not.toHaveProperty('senhaHash');

    const [linha] = await fonte.query(
      'SELECT senha_hash FROM usuario WHERE email = $1',
      [valido.email],
    );
    expect(linha.senha_hash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('409: e-mail duplicado (sem diferenciar maiúsculas)', async () => {
    await request(app.getHttpServer()).post('/auth/cadastro').send(valido);
    await request(app.getHttpServer())
      .post('/auth/cadastro')
      .send({ ...valido, email: 'CARLOS@mind.app' })
      .expect(409);
  });

  it.each([
    ['senha curta', { senha: '1234567' }],
    ['e-mail inválido', { email: 'nao-e-email' }],
    ['data inválida', { dataNascimento: '20/08/1999' }],
    ['nome vazio', { nome: '   ' }],
  ])('400: %s', async (_caso, alteracao) => {
    const res = await request(app.getHttpServer())
      .post('/auth/cadastro')
      .send({ ...valido, ...alteracao })
      .expect(400);
    expect(res.body.message).toBeDefined();
  });

  it('400: rejeita campos não previstos (ex.: tentar definir o papel)', async () => {
    await request(app.getHttpServer())
      .post('/auth/cadastro')
      .send({ ...valido, papel: 'PROFISSIONAL' })
      .expect(400);
  });
});
