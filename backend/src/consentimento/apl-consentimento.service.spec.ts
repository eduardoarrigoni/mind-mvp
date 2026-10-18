import {
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHAVE_EXIGE_TCLE } from '../auth/decoradores.js';
import { Papel } from '../usuarios/usuario.entity.js';
import { AplConsentimento } from './apl-consentimento.service.js';
import { AceiteTcleDAO, TermoConsentimentoDAO } from './consentimento.dao.js';
import { AceiteTcle, TermoConsentimento } from './consentimento.entity.js';
import { TcleGuard } from './tcle.guard.js';

const termo = Object.assign(new TermoConsentimento(), {
  id: 'termo-1',
  versao: '1.0',
  texto: 'Texto do termo',
  vigenteDesde: new Date('2026-10-01'),
});

function montar() {
  const termos = { buscarVigente: vi.fn().mockResolvedValue(termo) };
  const aceites = {
    buscarAceite: vi.fn().mockResolvedValue(null),
    salvar: vi
      .fn()
      .mockImplementation(async (a: AceiteTcle) =>
        Object.assign(a, { id: 'aceite-1', aceitoEm: new Date() }),
      ),
  };
  const apl = new AplConsentimento(
    termos as unknown as TermoConsentimentoDAO,
    aceites as unknown as AceiteTcleDAO,
  );
  return { termos, aceites, apl };
}

describe('AplConsentimento – TCLE (UC13)', () => {
  it('devolve texto, versão e início de vigência do termo vigente', async () => {
    const { apl } = montar();
    await expect(apl.termoVigente()).resolves.toEqual({
      versao: '1.0',
      texto: 'Texto do termo',
      vigenteDesde: termo.vigenteDesde,
    });
  });

  it('404 se não houver termo vigente', async () => {
    const { apl, termos } = montar();
    termos.buscarVigente.mockResolvedValue(null);
    await expect(apl.termoVigente()).rejects.toBeInstanceOf(NotFoundException);
  });

  it('registra o aceite com usuário, versão e data/hora', async () => {
    const { apl, aceites } = montar();
    const aceite = await apl.aceitar('usuario-1', '1.0');

    expect(aceite.versao).toBe('1.0');
    expect(aceite.aceitoEm).toBeInstanceOf(Date);
    const salvo = aceites.salvar.mock.calls[0][0] as AceiteTcle;
    expect(salvo.usuario.id).toBe('usuario-1');
    expect(salvo.termo).toBe(termo);
  });

  it('aceitar de novo não duplica o registro (idempotente)', async () => {
    const { apl, aceites } = montar();
    const anterior = Object.assign(new AceiteTcle(), {
      aceitoEm: new Date('2026-10-02'),
    });
    aceites.buscarAceite.mockResolvedValue(anterior);

    await expect(apl.aceitar('usuario-1', '1.0')).resolves.toEqual({
      versao: '1.0',
      aceitoEm: anterior.aceitoEm,
    });
    expect(aceites.salvar).not.toHaveBeenCalled();
  });

  it('aceites simultâneos: a violação de unicidade devolve o aceite já gravado', async () => {
    const { apl, aceites } = montar();
    const gravado = Object.assign(new AceiteTcle(), { aceitoEm: new Date() });
    aceites.salvar.mockRejectedValue(
      Object.assign(new Error('dup'), { code: '23505' }),
    );
    aceites.buscarAceite
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(gravado);

    await expect(apl.aceitar('usuario-1', '1.0')).resolves.toMatchObject({
      aceitoEm: gravado.aceitoEm,
    });
  });

  it('409 se a versão aceita não for a vigente', async () => {
    const { apl, aceites } = montar();
    await expect(apl.aceitar('usuario-1', '0.9')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(aceites.salvar).not.toHaveBeenCalled();
  });

  it('aceitouVigente reflete o registro do aceite', async () => {
    const { apl, aceites, termos } = montar();
    await expect(apl.aceitouVigente('usuario-1')).resolves.toBe(false);

    aceites.buscarAceite.mockResolvedValue(new AceiteTcle());
    await expect(apl.aceitouVigente('usuario-1')).resolves.toBe(true);
    expect(aceites.buscarAceite).toHaveBeenCalledWith('usuario-1', 'termo-1');

    termos.buscarVigente.mockResolvedValue(null);
    await expect(apl.aceitouVigente('usuario-1')).resolves.toBe(false);
  });
});

describe('TcleGuard (RN08)', () => {
  function contexto(papel: Papel, exige = true): ExecutionContext {
    const handler = () => undefined;
    if (exige) Reflect.defineMetadata(CHAVE_EXIGE_TCLE, true, handler);
    return {
      getHandler: () => handler,
      getClass: () => class {},
      switchToHttp: () => ({
        getRequest: () => ({ usuario: { id: 'usuario-1', papel } }),
      }),
    } as unknown as ExecutionContext;
  }

  function guard(aceitou: boolean) {
    const apl = { aceitouVigente: vi.fn().mockResolvedValue(aceitou) };
    return {
      apl,
      guard: new TcleGuard(new Reflector(), apl as unknown as AplConsentimento),
    };
  }

  it('rota sem @ExigeTcle não consulta o aceite', async () => {
    const { guard: g, apl } = guard(false);
    await expect(g.canActivate(contexto(Papel.PACIENTE, false))).resolves.toBe(
      true,
    );
    expect(apl.aceitouVigente).not.toHaveBeenCalled();
  });

  it('paciente sem aceite: 403', async () => {
    const { guard: g } = guard(false);
    await expect(
      g.canActivate(contexto(Papel.PACIENTE)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('paciente com aceite: libera', async () => {
    const { guard: g } = guard(true);
    await expect(g.canActivate(contexto(Papel.PACIENTE))).resolves.toBe(true);
  });

  it('profissional não precisa do TCLE do paciente', async () => {
    const { guard: g } = guard(false);
    await expect(g.canActivate(contexto(Papel.PROFISSIONAL))).resolves.toBe(
      true,
    );
  });
});
