import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { dataLocal, somarDias } from '../src/checkins/data-local.js';
import { configurarApp } from '../src/configurar-app.js';

describe('GET /checkins – histórico (e2e – UC10 parcial)', () => {
  let app: INestApplication;
  let fonte: DataSource;
  const http = () => request(app.getHttpServer());
  const hoje = dataLocal();

  /** Cadastra, autentica e aceita o TCLE; devolve token e id. */
  async function paciente(email: string) {
    const senha = 'senhaDoPaciente1';
    await http()
      .post('/auth/cadastro')
      .send({ nome: 'Paciente', email, dataNascimento: '2000-01-01', senha })
      .expect(201);
    const { body } = await http()
      .post('/auth/login')
      .send({ email, senha })
      .expect(200);
    return { token: body.accessToken as string, id: body.usuario.id as string };
  }

  /** Insere check-ins diretamente, nos dias `hoje − n` informados. */
  async function semear(pacienteId: string, diasAtras: number[], humor = 3) {
    for (const n of diasAtras) {
      await fonte.query(
        `INSERT INTO checkin (paciente_id, data, humor, energia, horas_sono)
         VALUES ($1, $2, $3, 3, 7)`,
        [pacienteId, somarDias(hoje, -n), humor],
      );
    }
  }

  const historico = (token: string, consulta = '') =>
    http().get(`/checkins${consulta}`).set('Authorization', `Bearer ${token}`);

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

  it('?dias=30: só os 30 últimos dias, do mais recente ao mais antigo', async () => {
    const ana = await paciente('ana@mind.app');
    await semear(ana.id, [5, 0, 29, 12, 30, 45]);

    const res = await historico(ana.token, '?dias=30').expect(200);

    expect(res.body.map((c: { data: string }) => c.data)).toEqual(
      [0, 5, 12, 29].map((n) => somarDias(hoje, -n)),
    );
    expect(res.body[0]).toMatchObject({ humor: 3, energia: 3, horasSono: 7 });
  });

  it('sem parâmetro usa 30 dias; ?dias=7 restringe a janela', async () => {
    const ana = await paciente('ana@mind.app');
    await semear(ana.id, [0, 6, 7, 29, 30]);

    expect((await historico(ana.token).expect(200)).body).toHaveLength(4);
    expect(
      (await historico(ana.token, '?dias=7').expect(200)).body,
    ).toHaveLength(2);
  });

  it('paciente A nunca vê dados do paciente B', async () => {
    const ana = await paciente('ana@mind.app');
    const bia = await paciente('bia@mind.app');
    await semear(ana.id, [0, 1], 5);
    await semear(bia.id, [0, 1, 2], 1);

    const daAna = (await historico(ana.token).expect(200)).body;
    const daBia = (await historico(bia.token).expect(200)).body;

    expect(daAna).toHaveLength(2);
    expect(daAna.every((c: { humor: number }) => c.humor === 5)).toBe(true);
    expect(daBia).toHaveLength(3);
    expect(daBia.every((c: { humor: number }) => c.humor === 1)).toBe(true);
    // Tentar escolher outro paciente pela URL é recusado.
    await historico(ana.token, `?pacienteId=${bia.id}`).expect(400);
  });

  it('histórico vazio devolve lista vazia', async () => {
    const ana = await paciente('ana@mind.app');
    await historico(ana.token).expect(200, []);
  });

  it('o check-in registrado pela API aparece no histórico', async () => {
    const ana = await paciente('ana@mind.app');
    await http()
      .post('/tcle/aceite')
      .set('Authorization', `Bearer ${ana.token}`)
      .send({ versao: '1.0' })
      .expect(201);
    await http()
      .post('/checkins')
      .set('Authorization', `Bearer ${ana.token}`)
      .send({ humor: 4, energia: 4, horasSono: 8, observacao: 'Hoje' })
      .expect(201);

    const res = await historico(ana.token).expect(200);
    expect(res.body).toEqual([
      expect.objectContaining({ data: hoje, observacao: 'Hoje' }),
    ]);
  });

  it.each(['?dias=0', '?dias=91', '?dias=abc', '?dias=2.5'])(
    '400: %s',
    async (consulta) => {
      const ana = await paciente('ana@mind.app');
      await historico(ana.token, consulta).expect(400);
    },
  );

  it('401 sem token', async () => {
    await http().get('/checkins').expect(401);
  });

  it('CQ04: responde em ≤ 2 s com 30 dias de dados (e outros 50 pacientes no banco)', async () => {
    const ana = await paciente('ana@mind.app');
    const dias = Array.from({ length: 30 }, (_, n) => n);
    await semear(ana.id, dias);
    // Massa de outros pacientes para a consulta não rodar numa tabela trivial.
    await fonte.query(
      `INSERT INTO usuario (nome, email, senha_hash, papel)
       SELECT 'Outro', 'outro' || i || '@mind.app', 'x', 'PACIENTE'
         FROM generate_series(1, 50) i`,
    );
    await fonte.query(
      `INSERT INTO checkin (paciente_id, data, humor, energia, horas_sono)
       SELECT u.id, $1::date - d, 3, 3, 7
         FROM usuario u CROSS JOIN generate_series(0, 29) d
        WHERE u.email LIKE 'outro%'`,
      [hoje],
    );

    const inicio = performance.now();
    const res = await historico(ana.token, '?dias=30').expect(200);
    const duracao = performance.now() - inicio;

    expect(res.body).toHaveLength(30);
    expect(duracao).toBeLessThan(2000);
  });
});
