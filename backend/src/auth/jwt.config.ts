import { JwtModuleOptions } from '@nestjs/jwt';

/** Segredo usado só fora de produção (desenvolvimento local e testes). */
const SEGREDO_DESENVOLVIMENTO =
  'mind-segredo-de-desenvolvimento-nao-usar-em-producao';

/** Opções do JWT a partir do ambiente. Em produção, JWT_SECRET é obrigatório. */
export function opcoesJwt(
  env: NodeJS.ProcessEnv = process.env,
): JwtModuleOptions {
  const segredo = env.JWT_SECRET;
  if (!segredo && env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET não definido: obrigatório em produção.');
  }
  return {
    secret: segredo || SEGREDO_DESENVOLVIMENTO,
    signOptions: {
      expiresIn: (env.JWT_EXPIRES_IN ?? '8h') as `${number}h`,
    },
  };
}
