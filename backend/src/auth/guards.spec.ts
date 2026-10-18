import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Papel } from '../usuarios/usuario.entity.js';
import { CHAVE_PAPEIS, CHAVE_PUBLICO } from './decoradores.js';
import { AutenticacaoGuard, PapeisGuard } from './guards.js';
import { opcoesJwt } from './jwt.config.js';

/** Contexto HTTP falso com metadados de rota opcionais. */
function contexto(
  req: Record<string, unknown>,
  metadados: Record<string, unknown> = {},
): ExecutionContext {
  const handler = () => undefined;
  for (const [chave, valor] of Object.entries(metadados)) {
    Reflect.defineMetadata(chave, valor, handler);
  }
  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe('AutenticacaoGuard', () => {
  const jwt = new JwtService({ secret: 'segredo-de-teste' });
  const guard = new AutenticacaoGuard(jwt, new Reflector());

  it('libera rotas @Publico() sem token', async () => {
    const ctx = contexto({ headers: {} }, { [CHAVE_PUBLICO]: true });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('401 sem token', async () => {
    await expect(
      guard.canActivate(contexto({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('401 com esquema diferente de Bearer', async () => {
    const ctx = contexto({ headers: { authorization: 'Basic abc' } });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('401 com token assinado por outro segredo', async () => {
    const falso = await new JwtService({ secret: 'outro' }).signAsync({
      sub: 'x',
      papel: Papel.PACIENTE,
    });
    const ctx = contexto({ headers: { authorization: `Bearer ${falso}` } });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('token válido: anexa o usuário à requisição', async () => {
    const token = await jwt.signAsync({ sub: 'uuid-1', papel: Papel.PACIENTE });
    const req: Record<string, unknown> = {
      headers: { authorization: `Bearer ${token}` },
    };
    await expect(guard.canActivate(contexto(req))).resolves.toBe(true);
    expect(req.usuario).toEqual({ id: 'uuid-1', papel: Papel.PACIENTE });
  });
});

describe('PapeisGuard', () => {
  const guard = new PapeisGuard(new Reflector());
  const exige = { [CHAVE_PAPEIS]: [Papel.PROFISSIONAL] };

  it('rota sem @Papeis: libera qualquer usuário autenticado', () => {
    const ctx = contexto({ usuario: { id: '1', papel: Papel.PACIENTE } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('PAPEL permitido: libera', () => {
    const ctx = contexto(
      { usuario: { id: '1', papel: Papel.PROFISSIONAL } },
      exige,
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('PAPEL não permitido: 403', () => {
    const ctx = contexto(
      { usuario: { id: '1', papel: Papel.PACIENTE } },
      exige,
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});

describe('opcoesJwt', () => {
  it('exige JWT_SECRET em produção', () => {
    expect(() => opcoesJwt({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/);
  });

  it('usa JWT_SECRET e JWT_EXPIRES_IN quando definidos', () => {
    expect(
      opcoesJwt({ JWT_SECRET: 's3gr3do', JWT_EXPIRES_IN: '2h' }),
    ).toMatchObject({ secret: 's3gr3do', signOptions: { expiresIn: '2h' } });
  });
});
