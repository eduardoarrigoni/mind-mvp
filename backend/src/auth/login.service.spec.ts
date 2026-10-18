import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UsuarioDAO } from '../usuarios/usuario.dao.js';
import { Paciente, Papel } from '../usuarios/usuario.entity.js';
import {
  AplAutenticacao,
  MENSAGEM_LOGIN_INVALIDO,
} from './apl-autenticacao.service.js';

describe('AplAutenticacao – login (UC01)', () => {
  const jwt = new JwtService({ secret: 'segredo-de-teste' });
  const senha = 'senhaForte123';
  let paciente: Paciente;
  let dao: {
    buscarPorEmail: ReturnType<typeof vi.fn>;
    buscarPorId: ReturnType<typeof vi.fn>;
  };
  let apl: AplAutenticacao;

  beforeAll(async () => {
    paciente = Object.assign(new Paciente(), {
      id: 'uuid-1',
      nome: 'Ana Lima',
      email: 'ana@mind.app',
      dataNascimento: '2001-03-15',
      criadoEm: new Date(),
      // Custo baixo só para o teste ser rápido; o custo real é verificado no cadastro.
      senhaHash: await bcrypt.hash(senha, 4),
    });
  });

  beforeEach(() => {
    dao = {
      buscarPorEmail: vi.fn().mockResolvedValue(paciente),
      buscarPorId: vi.fn().mockResolvedValue(paciente),
    };
    apl = new AplAutenticacao(dao as unknown as UsuarioDAO, jwt);
  });

  it('devolve um JWT com o id e o PAPEL do usuário', async () => {
    const sessao = await apl.entrar({ email: 'ana@mind.app', senha });

    const carga = await jwt.verifyAsync<{ sub: string; papel: Papel }>(
      sessao.accessToken,
    );
    expect(carga).toMatchObject({ sub: 'uuid-1', papel: Papel.PACIENTE });
    expect(sessao.usuario).toMatchObject({ id: 'uuid-1', papel: 'PACIENTE' });
    expect(sessao.usuario).not.toHaveProperty('senhaHash');
    expect(dao.buscarPorEmail).toHaveBeenCalledWith('ana@mind.app', true);
  });

  it('senha errada: 401 com mensagem genérica', async () => {
    const tentativa = apl.entrar({ email: 'ana@mind.app', senha: 'outra' });
    await expect(tentativa).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(tentativa).rejects.toThrow(MENSAGEM_LOGIN_INVALIDO);
  });

  it('e-mail inexistente: mesmo 401 e mesma mensagem (não revela qual campo errou)', async () => {
    dao.buscarPorEmail.mockResolvedValue(null);
    const comparar = vi.spyOn(bcrypt, 'compare');

    const tentativa = apl.entrar({ email: 'ninguem@mind.app', senha });
    await expect(tentativa).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(tentativa).rejects.toThrow(MENSAGEM_LOGIN_INVALIDO);
    // Compara mesmo assim (hash fictício), para não diferenciar pelo tempo de resposta.
    expect(comparar).toHaveBeenCalled();
    comparar.mockRestore();
  });

  it('buscarPerfil devolve os dados públicos do usuário', async () => {
    await expect(apl.buscarPerfil('uuid-1')).resolves.toMatchObject({
      email: 'ana@mind.app',
    });
  });

  it('buscarPerfil de usuário removido: 401', async () => {
    dao.buscarPorId.mockResolvedValue(null);
    await expect(apl.buscarPerfil('uuid-x')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
