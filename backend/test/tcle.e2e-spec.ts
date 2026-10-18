import { Controller, INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { ExigeTcle, Papeis } from '../src/auth/decoradores.js';
import { configurarApp } from '../src/configurar-app.js';
import { MENSAGEM_TCLE_PENDENTE } from '../src/consentimento/tcle.guard.js';
import { Papel } from '../src/usuarios/usuario.entity.js';

/** Simula um endpoint de registro clínico (o check-in real chega no PB11). */
@Controller('teste')
class RegistroClinicoDeTeste {
  @Papeis(Papel.PACIENTE)
  @ExigeTcle()
  @Post('registro-clinico')
  registrar() {
    return { registrado: true };
  }
}

describe('TCLE (e2e – UC13)', () => {
  let app: INestApplication;
  let fonte: DataSource;
  let token: string;

  const http = () => request(app.getHttpServer());
  const autenticado = (req: request.Test) =>
    req.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [RegistroClinicoDeTeste],
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
    const paciente = {
      nome: 'Beatriz Rocha',
      email: 'bia@mind.app',
      dataNascimento: '2000-01-10',
      senha: 'senhaDaBia1',
    };
    await http().post('/auth/cadastro').send(paciente).expect(201);
    const res = await http()
      .post('/auth/login')
      .send({ email: paciente.email, senha: paciente.senha })
      .expect(200);
    token = res.body.accessToken;
    expect(res.body.usuario.tcleAceito).toBe(false);
  });

  it('GET /tcle/vigente: texto e versão do termo (rota pública)', async () => {
    const res = await http().get('/tcle/vigente').expect(200);
    expect(res.body.versao).toBe('1.0');
    expect(res.body.texto).toContain('não substitui');
    expect(res.body.vigenteDesde).toBeDefined();
  });

  it('fluxo cadastro → login → registro bloqueado → aceite → registro liberado', async () => {
    const bloqueado = await autenticado(
      http().post('/teste/registro-clinico'),
    ).expect(403);
    expect(bloqueado.body.message).toBe(MENSAGEM_TCLE_PENDENTE);

    const aceite = await autenticado(http().post('/tcle/aceite'))
      .send({ versao: '1.0' })
      .expect(201);
    expect(aceite.body.versao).toBe('1.0');
    expect(new Date(aceite.body.aceitoEm).getTime()).not.toBeNaN();

    const [linha] = await fonte.query(
      `SELECT u.email, t.versao, a.aceito_em
         FROM aceite_tcle a
         JOIN usuario u ON u.id = a.usuario_id
         JOIN termo_consentimento t ON t.id = a.termo_id`,
    );
    expect(linha).toMatchObject({ email: 'bia@mind.app', versao: '1.0' });

    await autenticado(http().post('/teste/registro-clinico')).expect(201, {
      registrado: true,
    });
    const perfil = await autenticado(http().get('/auth/me')).expect(200);
    expect(perfil.body.tcleAceito).toBe(true);
  });

  it('aceite repetido não duplica o registro', async () => {
    await autenticado(http().post('/tcle/aceite')).send({ versao: '1.0' });
    await autenticado(http().post('/tcle/aceite'))
      .send({ versao: '1.0' })
      .expect(201);
    const [{ total }] = await fonte.query(
      'SELECT count(*)::int AS total FROM aceite_tcle',
    );
    expect(total).toBe(1);
  });

  it('409 ao aceitar versão que não é a vigente; 400 sem versão', async () => {
    await autenticado(http().post('/tcle/aceite'))
      .send({ versao: '0.9' })
      .expect(409);
    await autenticado(http().post('/tcle/aceite')).send({}).expect(400);
  });

  it('401 ao aceitar sem token', async () => {
    await http().post('/tcle/aceite').send({ versao: '1.0' }).expect(401);
  });
});
