import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ExigeTcle, Papeis, UsuarioAtual } from '../auth/decoradores.js';
import type { UsuarioAutenticado } from '../auth/decoradores.js';
import { Papel } from '../usuarios/usuario.entity.js';
import { AplCheckin, CheckinPublico } from './apl-checkin.service.js';
import { CheckinDto } from './dto/checkin.dto.js';
import { HistoricoQueryDto } from './dto/historico.dto.js';

@Controller('checkins')
@Papeis(Papel.PACIENTE)
export class CheckinsController {
  constructor(private readonly aplCheckin: AplCheckin) {}

  /** UC04 – check-in do dia: 201 ao criar, 200 ao atualizar o do mesmo dia. */
  @ExigeTcle()
  @Post()
  async registrar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dados: CheckinDto,
    @Res({ passthrough: true }) resposta: Response,
  ): Promise<CheckinPublico> {
    const { checkin, criado } = await this.aplCheckin.registrar(
      usuario.id,
      dados,
    );
    resposta.status(criado ? HttpStatus.CREATED : HttpStatus.OK);
    return checkin;
  }

  /** UC10 (parcial) – histórico do próprio paciente (`?dias=30` por padrão). */
  @Get()
  historico(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query() { dias }: HistoricoQueryDto,
  ): Promise<CheckinPublico[]> {
    return this.aplCheckin.historico(usuario.id, dias);
  }
}
