import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ExigeTcle, Papeis, UsuarioAtual } from '../auth/decoradores.js';
import type { UsuarioAutenticado } from '../auth/decoradores.js';
import { Papel } from '../usuarios/usuario.entity.js';
import { AplCheckin, CheckinPublico } from './apl-checkin.service.js';
import { CheckinDto } from './dto/checkin.dto.js';

@Controller('checkins')
export class CheckinsController {
  constructor(private readonly aplCheckin: AplCheckin) {}

  /** UC04 – check-in do dia: 201 ao criar, 200 ao atualizar o do mesmo dia. */
  @Papeis(Papel.PACIENTE)
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
}
