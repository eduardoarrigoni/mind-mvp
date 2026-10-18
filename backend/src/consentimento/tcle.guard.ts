import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CHAVE_EXIGE_TCLE, UsuarioAutenticado } from '../auth/decoradores.js';
import { Papel } from '../usuarios/usuario.entity.js';
import { AplConsentimento } from './apl-consentimento.service.js';

export const MENSAGEM_TCLE_PENDENTE =
  'Aceite o Termo de Consentimento (TCLE) antes de registrar dados.';

/** RN08 – bloqueia registros clínicos de pacientes sem aceite do TCLE vigente. */
@Injectable()
export class TcleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly aplConsentimento: AplConsentimento,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const exige = this.reflector.getAllAndOverride<boolean>(CHAVE_EXIGE_TCLE, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!exige) return true;

    const { usuario } = ctx
      .switchToHttp()
      .getRequest<{ usuario?: UsuarioAutenticado }>();
    if (usuario?.papel !== Papel.PACIENTE) return true;

    if (!(await this.aplConsentimento.aceitouVigente(usuario.id))) {
      throw new ForbiddenException(MENSAGEM_TCLE_PENDENTE);
    }
    return true;
  }
}
