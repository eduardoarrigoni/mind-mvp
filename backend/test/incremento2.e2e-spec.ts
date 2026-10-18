import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { dataLocal, somarDias } from '../src/checkins/data-local.js';
import { configurarApp } from '../src/configurar-app.js';

/**
 * PB15 – Teste de aceitação do Incremento 2 (UC04 + UC10 parcial), só pela
 * API HTTP: jornada do check-in ao histórico, isolamento e desempenho.
 */
describe('Incremento 2 – check-in e histórico (e2e)', () => {
  let app: INestApplication;
  let fonte: DataSource;
  const http = () => request(app.getHttpServer());
  const hoje = dataLocal();

  /** Paciente pronto para registrar: cadastro + login + aceite do TCLE. */
  async function pacienteComTcle(email: string) {
    const senha = 'senhaDoPaciente1';
    await http()
      .post('/auth/cadastro')
      .send({ nome: 'Paciente', email, dataNascimento: '1995-05-05', senha })
      .expect(201);
    const { body } = await http()
      .post('/auth/login')
      .send({ email, senha })
      .expect(200);
    const token: string = body.accessToken;
    await http()
      .post('/tcle/aceite')
      .set('Authorization', `Bearer ${token}`)
      .send({ versao: '1.0' })
      .expect(201);
    return { token, id: body.usuario.id as string };
  }

  const checkin = (token: string, corpo: object) =>
    http()
      .post('/checkins')
      .set('Authorization', `Bearer ${token}`)
      .send(corpo);
  const historico = (token: string, dias = 30) =>
    http()
      .get(`/checkins?dias=${dias}`)
      .set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configurarApp(modulo.createNestApplication());
    await app.init();
    fonte = app.get(DataSource);
    await fonte.query('TRUNCATE TABLE "usuario" CASCADE');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('jornada: registrar → acompanhar', () => {
    let ana: { token: string; id: string };

    it('1. histórico começa vazio', async () => {
      ana = await pacienteComTcle('ana@mind.app');
      await historico(ana.token).expect(200, []);
    });

    it('2. check-in do dia é criado (201) e aparece no histórico', async () => {
      const res = await checkin(ana.token, {
        humor: 2,
        energia: 2,
        horasSono: 5.5,
        observacao: 'Acordei cansada',
      }).expect(201);
      expect(res.body.data).toBe(hoje);

      const { body } = await historico(ana.token).expect(200);
      expect(body).toEqual([
        expect.objectContaining({
          data: hoje,
          humor: 2,
          energia: 2,
          horasSono: 5.5,
          observacao: 'Acordei cansada',
        }),
      ]);
    });

    it('3. novo envio no mesmo dia atualiza (200) – continua 1 registro', async () => {
      await checkin(ana.token, { humor: 4, energia: 3, horasSono: 5.5 }).expect(
        200,
      );
      const { body } = await historico(ana.token).expect(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({ humor: 4, energia: 3, observacao: null });
    });

    it('4. dias anteriores aparecem em ordem, do mais recente ao mais antigo', async () => {
      for (const n of [1, 3]) {
        await fonte.query(
          `INSERT INTO checkin (paciente_id, data, humor, energia, horas_sono)
           VALUES ($1, $2, 3, 3, 8)`,
          [ana.id, somarDias(hoje, -n)],
        );
      }
      const { body } = await historico(ana.token).expect(200);
      expect(body.map((c: { data: string }) => c.data)).toEqual([
        hoje,
        somarDias(hoje, -1),
        somarDias(hoje, -3),
      ]);
    });
  });

  describe('privacidade: paciente A não acessa dados de B', () => {
    it('cada paciente só vê e só altera os próprios check-ins', async () => {
      const a = await pacienteComTcle('a@mind.app');
      const b = await pacienteComTcle('b@mind.app');
      await checkin(a.token, { humor: 5, energia: 5, horasSono: 9 }).expect(
        201,
      );
      await checkin(b.token, { humor: 1, energia: 1, horasSono: 3 }).expect(
        201,
      );

      const daA = (await historico(a.token).expect(200)).body;
      const daB = (await historico(b.token).expect(200)).body;
      expect(daA).toHaveLength(1);
      expect(daA[0].humor).toBe(5);
      expect(daB).toHaveLength(1);
      expect(daB[0].humor).toBe(1);
      expect(daA[0].id).not.toBe(daB[0].id);

      // Tentativas de apontar para o outro paciente são recusadas.
      await checkin(a.token, {
        humor: 3,
        energia: 3,
        horasSono: 7,
        pacienteId: b.id,
      }).expect(400);
      await http()
        .get(`/checkins?pacienteId=${b.id}`)
        .set('Authorization', `Bearer ${a.token}`)
        .expect(400);
      expect((await historico(b.token).expect(200)).body[0].humor).toBe(1);
    });

    it('sem token não há acesso a check-in nem a histórico', async () => {
      await http().get('/checkins').expect(401);
      await http()
        .post('/checkins')
        .send({ humor: 3, energia: 3, horasSono: 7 })
        .expect(401);
    });
  });

  describe('defesa em profundidade no banco', () => {
    it.each([
      ['humor 6', 6, 3, 7, /CHK_checkin_humor/],
      ['energia 0', 3, 0, 7, /CHK_checkin_energia/],
      ['sono 25', 3, 3, 25, /CHK_checkin_horas_sono|numeric field overflow/],
    ])(
      'o banco recusa %s mesmo sem passar pela API',
      async (_c, h, e, s, erro) => {
        const { id } = await pacienteComTcle(`db${h}${e}${s}@mind.app`);
        await expect(
          fonte.query(
            `INSERT INTO checkin (paciente_id, data, humor, energia, horas_sono)
           VALUES ($1, $2, $3, $4, $5)`,
            [id, hoje, h, e, s],
          ),
        ).rejects.toThrow(erro);
      },
    );

    it('o banco recusa dois check-ins do mesmo paciente no mesmo dia', async () => {
      const { id } = await pacienteComTcle('dup@mind.app');
      const inserir = () =>
        fonte.query(
          `INSERT INTO checkin (paciente_id, data, humor, energia, horas_sono)
           VALUES ($1, $2, 3, 3, 7)`,
          [id, hoje],
        );
      await inserir();
      await expect(inserir()).rejects.toThrow(/UQ_checkin_paciente_data/);
    });
  });

  describe('desempenho (CQ04)', () => {
    it('histórico de 30 dias: 20 requisições, todas ≤ 2 s (registra o p95)', async () => {
      const p = await pacienteComTcle('perf@mind.app');
      await fonte.query(
        `INSERT INTO checkin (paciente_id, data, humor, energia, horas_sono, observacao)
         SELECT $1, $2::date - d, 1 + d % 5, 1 + (d + 2) % 5, 7, repeat('x', 500)
           FROM generate_series(1, 29) d`,
        [p.id, hoje],
      );
      await checkin(p.token, { humor: 3, energia: 3, horasSono: 8 }).expect(
        201,
      );

      const tempos: number[] = [];
      for (let i = 0; i < 20; i++) {
        const inicio = performance.now();
        const res = await historico(p.token).expect(200);
        tempos.push(performance.now() - inicio);
        expect(res.body).toHaveLength(30);
      }
      tempos.sort((x, y) => x - y);
      const p95 = tempos[Math.ceil(tempos.length * 0.95) - 1];
      console.info(
        `[CQ04] GET /checkins?dias=30 – mediana ${tempos[10].toFixed(1)} ms, p95 ${p95.toFixed(1)} ms, máx ${tempos[19].toFixed(1)} ms`,
      );
      expect(Math.max(...tempos)).toBeLessThan(2000);
    });
  });
});
