import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { DAOTypeORM } from '../database/persistencia/dao-typeorm.js';
import { AceiteTcle, TermoConsentimento } from './consentimento.entity.js';

@Injectable()
export class TermoConsentimentoDAO extends DAOTypeORM<TermoConsentimento> {
  constructor(
    @InjectRepository(TermoConsentimento)
    repositorio: Repository<TermoConsentimento>,
  ) {
    super(repositorio);
  }

  /** Versão que vale agora: a de início de vigência mais recente. */
  buscarVigente(agora = new Date()): Promise<TermoConsentimento | null> {
    return this.repositorio.findOne({
      where: { vigenteDesde: LessThanOrEqual(agora) },
      order: { vigenteDesde: 'DESC' },
    });
  }
}

@Injectable()
export class AceiteTcleDAO extends DAOTypeORM<AceiteTcle> {
  constructor(
    @InjectRepository(AceiteTcle) repositorio: Repository<AceiteTcle>,
  ) {
    super(repositorio);
  }

  buscarAceite(usuarioId: string, termoId: string): Promise<AceiteTcle | null> {
    return this.repositorio.findOne({
      where: { usuario: { id: usuarioId }, termo: { id: termoId } },
    });
  }
}
