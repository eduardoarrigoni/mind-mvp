import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Papel } from '../usuarios/usuario.entity.js';
import {
  CHAVE_PAPEIS,
  CHAVE_PUBLICO,
  UsuarioAutenticado,
} from './decoradores.js';

type Requisicao = {
  headers: { authorization?: string };
  usuario?: UsuarioAutenticado;
};

/** Exige um JWT válido (`Authorization: Bearer <token>`) em toda rota não marcada com @Publico(). */
@Injectable()
export class AutenticacaoGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const publico = this.reflector.getAllAndOverride<boolean>(CHAVE_PUBLICO, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (publico) return true;

    const req = ctx.switchToHttp().getRequest<Requisicao>();
    const [tipo, token] = req.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Autenticação necessária.');
    }
    try {
      const carga = await this.jwt.verifyAsync<{ sub: string; papel: Papel }>(
        token,
      );
      req.usuario = { id: carga.sub, papel: carga.papel };
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada.');
    }
    return true;
  }
}

/** Verifica o PAPEL do usuário nas rotas marcadas com @Papeis(...). Roda após o AutenticacaoGuard. */
@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const exigidos = this.reflector.getAllAndOverride<Papel[] | undefined>(
      CHAVE_PAPEIS,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!exigidos?.length) return true;

    const { usuario } = ctx.switchToHttp().getRequest<Requisicao>();
    if (!usuario || !exigidos.includes(usuario.papel)) {
      throw new ForbiddenException('Acesso não permitido para o seu perfil.');
    }
    return true;
  }
}
