import { DataSource } from 'typeorm';
import { opcoesBanco } from '../src/database/data-source.js';
import { DAOTypeORM } from '../src/database/persistencia/dao-typeorm.js';
import { UsuarioDAO } from '../src/usuarios/usuario.dao.js';
import {
  Paciente,
  Papel,
  Profissional,
  Usuario,
} from '../src/usuarios/usuario.entity.js';

describe('Persistência (integração com PostgreSQL)', () => {
  let fonte: DataSource;
  let usuarios: UsuarioDAO;

  beforeAll(async () => {
    fonte = await new DataSource(opcoesBanco()).initialize();
    usuarios = new UsuarioDAO(fonte.getRepository(Usuario));
  });

  afterAll(async () => {
    await fonte.destroy();
  });

  beforeEach(async () => {
    await fonte.query('TRUNCATE TABLE "usuario" CASCADE');
  });

  it('o esquema criado pelas migrations corresponde às entidades', async () => {
    const pendentes = await fonte.driver.createSchemaBuilder().log();
    expect(pendentes.upQueries.map((q) => q.query)).toEqual([]);
  });

  it('CRUD de Paciente pelo DAO genérico', async () => {
    const dao = new DAOTypeORM(fonte.getRepository(Paciente));
    const novo = Object.assign(new Paciente(), {
      nome: 'Ana',
      email: 'ana@mind.app',
      senhaHash: 'hash',
      dataNascimento: '2000-05-10',
    });

    const salvo = await dao.salvar(novo);
    expect(salvo.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(salvo.criadoEm).toBeInstanceOf(Date);

    const lido = await dao.buscarPorId(salvo.id);
    expect(lido).toMatchObject({ nome: 'Ana', dataNascimento: '2000-05-10' });
    expect(lido?.papel).toBe(Papel.PACIENTE);

    lido!.nome = 'Ana Souza';
    await dao.salvar(lido!);
    expect((await dao.buscarPorId(salvo.id))?.nome).toBe('Ana Souza');
    expect(await dao.listar()).toHaveLength(1);

    await dao.remover(salvo.id);
    expect(await dao.buscarPorId(salvo.id)).toBeNull();
  });

  it('herança em tabela única: o repositório de Usuario devolve as subclasses corretas', async () => {
    await fonte.getRepository(Paciente).save(
      Object.assign(new Paciente(), {
        nome: 'Pac',
        email: 'pac@mind.app',
        senhaHash: 'h',
      }),
    );
    await fonte.getRepository(Profissional).save(
      Object.assign(new Profissional(), {
        nome: 'Prof',
        email: 'prof@mind.app',
        senhaHash: 'h',
        registroProfissional: 'CRP 16/1234',
      }),
    );

    const todos = await usuarios.listar();
    const papeis = todos.map((u) => u.papel).sort();
    expect(papeis).toEqual([Papel.PACIENTE, Papel.PROFISSIONAL]);
    expect(todos.find((u) => u.papel === Papel.PROFISSIONAL)).toBeInstanceOf(
      Profissional,
    );
  });

  it('não retorna o hash da senha por padrão, apenas quando solicitado', async () => {
    await fonte.getRepository(Paciente).save(
      Object.assign(new Paciente(), {
        nome: 'Bia',
        email: 'bia@mind.app',
        senhaHash: 'segredo',
      }),
    );

    const semSenha = await usuarios.buscarPorEmail('  BIA@mind.app ');
    expect(semSenha?.senhaHash).toBeUndefined();

    const comSenha = await usuarios.buscarPorEmail('bia@mind.app', true);
    expect(comSenha?.senhaHash).toBe('segredo');
  });

  it('impede e-mails duplicados (restrição única no banco)', async () => {
    const repo = fonte.getRepository(Paciente);
    const dados = { nome: 'X', email: 'dup@mind.app', senhaHash: 'h' };
    await repo.save(Object.assign(new Paciente(), dados));
    await expect(
      repo.save(Object.assign(new Paciente(), dados)),
    ).rejects.toThrow(/UQ_usuario_email/);
  });

  it('todas as migrations podem ser revertidas e reaplicadas (rollback validado)', async () => {
    for (let i = 0; i < fonte.migrations.length; i++) {
      await fonte.undoLastMigration();
    }
    const [tabelas] = await fonte.query(
      `SELECT to_regclass('public.usuario') IS NULL
          AND to_regclass('public.termo_consentimento') IS NULL
          AND to_regclass('public.aceite_tcle') IS NULL
          AND to_regclass('public.checkin') IS NULL AS removidas`,
    );
    expect(tabelas.removidas).toBe(true);

    await fonte.runMigrations();
    expect(await fonte.showMigrations()).toBe(false);
    const [{ total }] = await fonte.query(
      'SELECT count(*)::int AS total FROM termo_consentimento',
    );
    expect(total).toBe(1);
  });
});
