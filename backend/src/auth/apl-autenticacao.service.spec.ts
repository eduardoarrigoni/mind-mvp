import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AplConsentimento } from '../consentimento/apl-consentimento.service.js';
import { UsuarioDAO } from '../usuarios/usuario.dao.js';
import { Paciente, Papel } from '../usuarios/usuario.entity.js';
import { AplAutenticacao, CUSTO_BCRYPT } from './apl-autenticacao.service.js';

describe('AplAutenticacao – cadastro de paciente (UC01)', () => {
  const dados = {
    nome: '  Ana Lima ',
    email: ' Ana@Mind.App ',
    dataNascimento: '2001-03-15',
    senha: 'senhaForte123',
  };
  let dao: {
    buscarPorEmail: ReturnType<typeof vi.fn>;
    salvar: ReturnType<typeof vi.fn>;
  };
  let apl: AplAutenticacao;

  beforeEach(() => {
    dao = {
      buscarPorEmail: vi.fn().mockResolvedValue(null),
      salvar: vi
        .fn()
        .mockImplementation(async (p: Paciente) =>
          Object.assign(p, { id: 'uuid-1', criadoEm: new Date() }),
        ),
    };
    apl = new AplAutenticacao(dao as unknown as UsuarioDAO, new JwtService(), {
      aceitouVigente: vi.fn(),
    } as unknown as AplConsentimento);
  });

  it('cria um Paciente com e-mail normalizado e nome sem espaços extras', async () => {
    const criado = await apl.cadastrarPaciente(dados);

    expect(criado).toMatchObject({
      id: 'uuid-1',
      nome: 'Ana Lima',
      email: 'ana@mind.app',
      papel: Papel.PACIENTE,
      dataNascimento: '2001-03-15',
    });
    expect(dao.salvar.mock.calls[0][0]).toBeInstanceOf(Paciente);
  });

  it('armazena a senha com bcrypt custo ≥ 12 (CQ01) e nunca em texto puro', async () => {
    await apl.cadastrarPaciente(dados);
    const salvo = dao.salvar.mock.calls[0][0] as Paciente;

    expect(salvo.senhaHash).not.toBe(dados.senha);
    expect(bcrypt.getRounds(salvo.senhaHash)).toBeGreaterThanOrEqual(12);
    expect(CUSTO_BCRYPT).toBeGreaterThanOrEqual(12);
    expect(await bcrypt.compare(dados.senha, salvo.senhaHash)).toBe(true);
  });

  it('não devolve o hash da senha', async () => {
    const criado = await apl.cadastrarPaciente(dados);
    expect(criado).not.toHaveProperty('senhaHash');
    expect(JSON.stringify(criado)).not.toContain('$2');
  });

  it('rejeita e-mail já cadastrado com 409', async () => {
    dao.buscarPorEmail.mockResolvedValue(new Paciente());
    await expect(apl.cadastrarPaciente(dados)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(dao.salvar).not.toHaveBeenCalled();
  });

  it('converte violação de unicidade do banco (cadastro simultâneo) em 409', async () => {
    dao.salvar.mockRejectedValue(
      Object.assign(new Error('dup'), { code: '23505' }),
    );
    await expect(apl.cadastrarPaciente(dados)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
