import { Injectable } from '@nestjs/common';
import { Paciente } from '../usuarios/usuario.entity.js';
import { CheckinDAO } from './checkin.dao.js';
import { Checkin } from './checkin.entity.js';
import { dataLocal } from './data-local.js';
import { CheckinDto } from './dto/checkin.dto.js';

export interface CheckinPublico {
  id: string;
  data: string;
  humor: number;
  energia: number;
  horasSono: number;
  observacao: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface ResultadoCheckin {
  checkin: CheckinPublico;
  /** true se criou o check-in do dia; false se atualizou o existente. */
  criado: boolean;
}

/** AplCheckin – UC04: registro do check-in diário do paciente. */
@Injectable()
export class AplCheckin {
  constructor(private readonly checkins: CheckinDAO) {}

  /**
   * Um check-in por dia: o primeiro envio do dia cria, os seguintes atualizam.
   * O paciente vem sempre do token (nunca do corpo da requisição).
   */
  async registrar(
    pacienteId: string,
    dados: CheckinDto,
    agora: Date = new Date(),
  ): Promise<ResultadoCheckin> {
    const data = dataLocal(agora);
    const existente = await this.checkins.buscarDoDia(pacienteId, data);
    if (existente) return this.atualizar(existente, dados);

    const novo = Object.assign(new Checkin(), {
      paciente: { id: pacienteId } as Paciente,
      data,
      ...this.campos(dados),
    });
    try {
      return {
        checkin: this.paraPublico(await this.checkins.salvar(novo)),
        criado: true,
      };
    } catch (erro) {
      // Dois envios simultâneos no mesmo dia: o segundo vira atualização.
      if ((erro as { code?: string }).code === '23505') {
        const gravado = await this.checkins.buscarDoDia(pacienteId, data);
        if (gravado) return this.atualizar(gravado, dados);
      }
      throw erro;
    }
  }

  private async atualizar(
    checkin: Checkin,
    dados: CheckinDto,
  ): Promise<ResultadoCheckin> {
    Object.assign(checkin, this.campos(dados));
    return {
      checkin: this.paraPublico(await this.checkins.salvar(checkin)),
      criado: false,
    };
  }

  private campos({ humor, energia, horasSono, observacao }: CheckinDto) {
    return { humor, energia, horasSono, observacao: observacao ?? null };
  }

  paraPublico(c: Checkin): CheckinPublico {
    return {
      id: c.id,
      data: c.data,
      humor: c.humor,
      energia: c.energia,
      horasSono: c.horasSono,
      observacao: c.observacao,
      criadoEm: c.criadoEm,
      atualizadoEm: c.atualizadoEm,
    };
  }
}
