import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { MENSAGEM_LOGIN_INVALIDO } from '../src/auth/apl-autenticacao.service.js';
import { Papeis } from '../src/auth/decoradores.js';
import { configurarApp } from '../src/configurar-app.js';
import { Papel, Profissional } from '../src/usuarios/usuario.entity.js';

/** Rota existente só no teste, para exercitar o guard de PAPEL. */
@Controller('teste')
class RotaSoProfissional {
  @Papeis(Papel.PROFISSIONAL)
  @Get('profissional')
  ok() {
    return { ok: true };
  }
}

describe('POST /auth/login e rotas protegidas (e2e – UC01)', () => {
  let app: INestApplication;
  let fonte: DataSource;

  const paciente = {
    nome: 'Carlos Pereira',
    email: 'carlos@mind.app',
    dataNascimento: '1999-08-20',
    senha: 'umaSenhaBoa1',
  };

  const http = () => request(app.getHttpServer());
  const entrar = (email: string, senha: string) =>
    http().post('/auth/login').send({ email, senha });

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [RotaSoProfissional],
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
    await http().post('/auth/cadastro').send(paciente).expect(201);
  });

  it('200: credenciais válidas devolvem JWT e o usuário sem senha', async () => {
    const res = await entrar('CARLOS@mind.app ', paciente.senha).expect(200);

    expect(res.body.accessToken).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(res.body.usuario).toMatchObject({
      email: 'carlos@mind.app',
      papel: 'PACIENTE',
    });
    expect(JSON.stringify(res.body)).not.toContain('senha');
  });

  it('401: senha errada e e-mail inexistente recebem a mesma resposta', async () => {
    const senhaErrada = await entrar(paciente.email, 'senhaErrada1').expect(
      401,
    );
    const emailInexistente = await entrar(
      'nao@mind.app',
      paciente.senha,
    ).expect(401);

    expect(senhaErrada.body.message).toBe(MENSAGEM_LOGIN_INVALIDO);
    expect(emailInexistente.body).toEqual(senhaErrada.body);
  });

  it('400: corpo sem senha', async () => {
    await http()
      .post('/auth/login')
      .send({ email: paciente.email })
      .expect(400);
  });

  it('GET /auth/eu: 401 sem token, 401 com token inválido, 200 com token', async () => {
    await http().get('/auth/eu').expect(401);
    await http()
      .get('/auth/eu')
      .set('Authorization', 'Bearer token.invalido.aqui')
      .expect(401);

    const { body } = await entrar(paciente.email, paciente.senha);
    const res = await http()
      .get('/auth/eu')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(200);
    expect(res.body).toMatchObject({ email: 'carlos@mind.app' });
  });

  it('guard de PAPEL: paciente recebe 403 e profissional 200', async () => {
    const tokenPaciente = (await entrar(paciente.email, paciente.senha)).body
      .accessToken;
    await http()
      .get('/teste/profissional')
      .set('Authorization', `Bearer ${tokenPaciente}`)
      .expect(403);

    await fonte.getRepository(Profissional).save(
      Object.assign(new Profissional(), {
        nome: 'Dra. Marta',
        email: 'marta@mind.app',
        senhaHash: await bcrypt.hash('senhaDaMarta1', 4),
        registroProfissional: 'CRP 16/0001',
      }),
    );
    const tokenProfissional = (await entrar('marta@mind.app', 'senhaDaMarta1'))
      .body.accessToken;
    await http()
      .get('/teste/profissional')
      .set('Authorization', `Bearer ${tokenProfissional}`)
      .expect(200, { ok: true });
  });

  it('rotas públicas continuam acessíveis sem token', async () => {
    await http().get('/').expect(200);
  });
});
