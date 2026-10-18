import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/configurar-app.js';
import { MENSAGEM_TCLE_PENDENTE } from '../src/consentimento/tcle.guard.js';
import { Profissional } from '../src/usuarios/usuario.entity.js';

describe('POST /checkins (e2e – UC04)', () => {
  let app: INestApplication;
  let fonte: DataSource;
  const http = () => request(app.getHttpServer());

  const valido = {
    humor: 4,
    energia: 3,
    horasSono: 7.5,
    observacao: 'Dormi bem',
  };

  /** Cadastra e autentica um paciente; aceita o TCLE se `aceitar`. */
  async function paciente(email: string, aceitar = true): Promise<string> {
    const senha = 'senhaDoPaciente1';
    await http()
      .post('/auth/cadastro')
      .send({ nome: 'Paciente', email, dataNascimento: '2000-01-01', senha })
      .expect(201);
    const { body } = await http()
      .post('/auth/login')
      .send({ email, senha })
      .expect(200);
    if (aceitar) {
      await http()
        .post('/tcle/aceite')
        .set('Authorization', `Bearer ${body.accessToken}`)
        .send({ versao: '1.0' })
        .expect(201);
    }
    return body.accessToken;
  }

  const enviar = (token: string, corpo: object) =>
    http()
      .post('/checkins')
      .set('Authorization', `Bearer ${token}`)
      .send(corpo);

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

  it('201: cria o check-in do dia com os valores enviados', async () => {
    const token = await paciente('ana@mind.app');
    const res = await enviar(token, valido).expect(201);

    expect(res.body).toMatchObject(valido);
    expect(res.body.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const [linha] = await fonte.query(
      `SELECT u.email, c.humor, c.horas_sono FROM checkin c JOIN usuario u ON u.id = c.paciente_id`,
    );
    expect(linha).toMatchObject({
      email: 'ana@mind.app',
      humor: 4,
      horas_sono: '7.5',
    });
  });

  it('200: segundo envio no mesmo dia atualiza o existente (um por dia)', async () => {
    const token = await paciente('ana@mind.app');
    const primeiro = await enviar(token, valido).expect(201);
    const segundo = await enviar(token, {
      humor: 2,
      energia: 1,
      horasSono: 4,
    }).expect(200);

    expect(segundo.body).toMatchObject({
      id: primeiro.body.id,
      humor: 2,
      energia: 1,
      horasSono: 4,
      observacao: null,
    });
    const [{ total }] = await fonte.query(
      'SELECT count(*)::int AS total FROM checkin',
    );
    expect(total).toBe(1);
  });

  it('403: paciente sem TCLE aceito', async () => {
    const token = await paciente('semtcle@mind.app', false);
    const res = await enviar(token, valido).expect(403);
    expect(res.body.message).toBe(MENSAGEM_TCLE_PENDENTE);
  });

  it('403: profissional não registra check-in', async () => {
    await fonte.getRepository(Profissional).save(
      Object.assign(new Profissional(), {
        nome: 'Dra. Marta',
        email: 'marta@mind.app',
        senhaHash: await bcrypt.hash('senhaDaMarta1', 4),
      }),
    );
    const { body } = await http()
      .post('/auth/login')
      .send({ email: 'marta@mind.app', senha: 'senhaDaMarta1' })
      .expect(200);
    await enviar(body.accessToken, valido).expect(403);
  });

  it('401: sem token', async () => {
    await http().post('/checkins').send(valido).expect(401);
  });

  it('o check-in é sempre do paciente do token (id no corpo é recusado)', async () => {
    const tokenAna = await paciente('ana@mind.app');
    const tokenBia = await paciente('bia@mind.app');
    const [{ id: idBia }] = await fonte.query(
      `SELECT id FROM usuario WHERE email = 'bia@mind.app'`,
    );

    await enviar(tokenAna, { ...valido, pacienteId: idBia }).expect(400);
    await enviar(tokenAna, valido).expect(201);
    await enviar(tokenBia, valido).expect(201);

    const linhas = await fonte.query(
      `SELECT u.email FROM checkin c JOIN usuario u ON u.id = c.paciente_id ORDER BY u.email`,
    );
    expect(linhas.map((l: { email: string }) => l.email)).toEqual([
      'ana@mind.app',
      'bia@mind.app',
    ]);
  });

  it.each([
    ['humor 0', { humor: 0 }],
    ['humor 6', { humor: 6 }],
    ['humor fracionado', { humor: 3.5 }],
    ['energia ausente', { energia: undefined }],
    ['sono negativo', { horasSono: -1 }],
    ['sono acima de 24', { horasSono: 24.5 }],
    ['sono com 2 casas', { horasSono: 7.25 }],
    ['observação com 501 caracteres', { observacao: 'x'.repeat(501) }],
  ])('400: %s', async (_caso, alteracao) => {
    const token = await paciente('ana@mind.app');
    const res = await enviar(token, { ...valido, ...alteracao }).expect(400);
    expect(res.body.message).toBeDefined();
  });

  it('aceita os limites: humor/energia 1 e 5, sono 0 e 24, observação de 500', async () => {
    const token = await paciente('ana@mind.app');
    await enviar(token, { humor: 1, energia: 5, horasSono: 0 }).expect(201);
    await enviar(token, {
      humor: 5,
      energia: 1,
      horasSono: 24,
      observacao: 'x'.repeat(500),
    }).expect(200);
  });
});
