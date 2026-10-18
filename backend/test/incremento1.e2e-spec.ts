import { Controller, INestApplication, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { MENSAGEM_LOGIN_INVALIDO } from '../src/auth/apl-autenticacao.service.js';
import { ExigeTcle, Papeis } from '../src/auth/decoradores.js';
import { configurarApp } from '../src/configurar-app.js';
import { MENSAGEM_TCLE_PENDENTE } from '../src/consentimento/tcle.guard.js';
import { Papel } from '../src/usuarios/usuario.entity.js';

/** Endpoint clínico de teste (o check-in real chega no Incremento 2). */
@Controller('teste-inc1')
class RegistroClinico {
  @Papeis(Papel.PACIENTE)
  @ExigeTcle()
  @Post('registro')
  registrar() {
    return { registrado: true };
  }
}

/**
 * PB10 – Teste de aceitação do Incremento 1 (UC01 + UC13), só pela API HTTP:
 * a jornada completa do paciente e os casos negativos exigidos no card.
 */
describe('Incremento 1 – jornada do paciente (e2e)', () => {
  let app: INestApplication;
  let fonte: DataSource;
  const http = () => request(app.getHttpServer());
  const comToken = (req: request.Test, token: string) =>
    req.set('Authorization', `Bearer ${token}`);

  const paciente = {
    nome: 'Daniela Moura',
    email: 'daniela@mind.app',
    dataNascimento: '1998-11-02',
    senha: 'umaSenhaSegura9',
  };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [RegistroClinico],
    }).compile();
    app = configurarApp(modulo.createNestApplication());
    await app.init();
    fonte = app.get(DataSource);
    await fonte.query('TRUNCATE TABLE "usuario" CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  // Os passos abaixo formam UMA jornada e rodam em sequência (estado compartilhado).
  let token: string;

  it('1. cadastro do paciente (201) sem expor a senha', async () => {
    const res = await http().post('/auth/cadastro').send(paciente).expect(201);
    expect(res.body).toMatchObject({
      email: paciente.email,
      papel: 'PACIENTE',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/senha|\$2[aby]\$/i);
  });

  it('2. login (200) devolve JWT e informa o TCLE pendente', async () => {
    const res = await http()
      .post('/auth/login')
      .send({ email: paciente.email, senha: paciente.senha })
      .expect(200);
    token = res.body.accessToken;
    expect(token.split('.')).toHaveLength(3);
    expect(res.body.usuario.tcleAceito).toBe(false);
  });

  it('3. registro clínico antes do aceite é bloqueado (403)', async () => {
    const res = await comToken(
      http().post('/teste-inc1/registro'),
      token,
    ).expect(403);
    expect(res.body.message).toBe(MENSAGEM_TCLE_PENDENTE);
  });

  it('4. paciente lê o TCLE vigente e o aceita (201)', async () => {
    const { body: termo } = await http().get('/tcle/vigente').expect(200);
    expect(termo.texto.length).toBeGreaterThan(200);

    const res = await comToken(http().post('/tcle/aceite'), token)
      .send({ versao: termo.versao })
      .expect(201);
    expect(res.body.versao).toBe(termo.versao);
  });

  it('5. depois do aceite: perfil indica tcleAceito e o registro é liberado', async () => {
    const perfil = await comToken(http().get('/auth/me'), token).expect(200);
    expect(perfil.body.tcleAceito).toBe(true);

    await comToken(http().post('/teste-inc1/registro'), token).expect(201);
  });

  it('6. novo login após o aceite não pede o TCLE de novo', async () => {
    const res = await http()
      .post('/auth/login')
      .send({ email: paciente.email, senha: paciente.senha })
      .expect(200);
    expect(res.body.usuario.tcleAceito).toBe(true);
  });

  describe('casos negativos', () => {
    it('e-mail duplicado (409), inclusive com maiúsculas', async () => {
      await http()
        .post('/auth/cadastro')
        .send({ ...paciente, email: 'DANIELA@mind.app' })
        .expect(409);
    });

    it('senha errada e e-mail inexistente: 401 idêntico', async () => {
      const a = await http()
        .post('/auth/login')
        .send({ email: paciente.email, senha: 'senhaErrada99' })
        .expect(401);
      const b = await http()
        .post('/auth/login')
        .send({ email: 'ninguem@mind.app', senha: paciente.senha })
        .expect(401);
      expect(a.body.message).toBe(MENSAGEM_LOGIN_INVALIDO);
      expect(b.body).toEqual(a.body);
    });

    it.each([
      ['GET', '/auth/me'],
      ['POST', '/tcle/aceite'],
      ['POST', '/teste-inc1/registro'],
    ])('rota protegida sem token: %s %s → 401', async (metodo, rota) => {
      const req = metodo === 'GET' ? http().get(rota) : http().post(rota);
      await req.expect(401);
    });

    it('token adulterado (papel trocado no payload) → 401', async () => {
      const [cabecalho, , assinatura] = token.split('.');
      const carga = Buffer.from(
        JSON.stringify({ sub: 'qualquer', papel: 'PROFISSIONAL' }),
      ).toString('base64url');
      await comToken(
        http().get('/auth/me'),
        `${cabecalho}.${carga}.${assinatura}`,
      ).expect(401);
    });

    it('token expirado → 401', async () => {
      const expirado = await app
        .get(JwtService)
        .signAsync({ sub: 'x', papel: Papel.PACIENTE }, { expiresIn: -10 });
      await comToken(http().get('/auth/me'), expirado).expect(401);
    });

    it('outro paciente sem aceite continua bloqueado (o aceite é individual)', async () => {
      const outro = { ...paciente, email: 'outro@mind.app' };
      await http().post('/auth/cadastro').send(outro).expect(201);
      const { body } = await http()
        .post('/auth/login')
        .send({ email: outro.email, senha: outro.senha })
        .expect(200);
      await comToken(
        http().post('/teste-inc1/registro'),
        body.accessToken,
      ).expect(403);
    });
  });
});
