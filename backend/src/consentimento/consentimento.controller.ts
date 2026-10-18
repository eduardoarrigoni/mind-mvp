import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Papeis, Publico, UsuarioAtual } from '../auth/decoradores.js';
import type { UsuarioAutenticado } from '../auth/decoradores.js';
import { Papel } from '../usuarios/usuario.entity.js';
import {
  AceitePublico,
  AplConsentimento,
  TermoPublico,
} from './apl-consentimento.service.js';
import { AceiteTcleDto } from './dto/aceite-tcle.dto.js';

@Controller('tcle')
export class ConsentimentoController {
  constructor(private readonly aplConsentimento: AplConsentimento) {}

  /** UC13 – texto e versão do TCLE vigente (público: pode ser lido antes do cadastro). */
  @Publico()
  @Get('vigente')
  vigente(): Promise<TermoPublico> {
    return this.aplConsentimento.termoVigente();
  }

  /** UC13 – aceite do TCLE vigente pelo paciente autenticado. */
  @Papeis(Papel.PACIENTE)
  @Post('aceite')
  @HttpCode(HttpStatus.CREATED)
  aceitar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dados: AceiteTcleDto,
  ): Promise<AceitePublico> {
    return this.aplConsentimento.aceitar(usuario.id, dados.versao);
  }
}
