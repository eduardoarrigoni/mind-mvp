import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Papel } from '../usuarios/usuario.entity.js';

/** Dados do usuário autenticado extraídos do JWT. */
export interface UsuarioAutenticado {
  id: string;
  papel: Papel;
}

export const CHAVE_PUBLICO = 'mind:publico';
export const CHAVE_PAPEIS = 'mind:papeis';

/** Libera a rota sem token (as rotas são protegidas por padrão). */
export const Publico = () => SetMetadata(CHAVE_PUBLICO, true);

/** Restringe a rota aos papéis informados (ex.: `@Papeis(Papel.PROFISSIONAL)`). */
export const Papeis = (...papeis: Papel[]) => SetMetadata(CHAVE_PAPEIS, papeis);

/** Injeta o usuário autenticado no handler. */
export const UsuarioAtual = createParamDecorator(
  (_dado: unknown, ctx: ExecutionContext): UsuarioAutenticado =>
    ctx.switchToHttp().getRequest<{ usuario: UsuarioAutenticado }>().usuario,
);
