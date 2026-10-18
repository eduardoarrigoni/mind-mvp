import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { DAOTypeORM } from '../database/persistencia/dao-typeorm.js';
import { Checkin } from './checkin.entity.js';

@Injectable()
export class CheckinDAO extends DAOTypeORM<Checkin> {
  constructor(@InjectRepository(Checkin) repositorio: Repository<Checkin>) {
    super(repositorio);
  }

  /** Check-ins do paciente a partir de `desde` (inclusive), do mais recente ao mais antigo. */
  listarDesde(pacienteId: string, desde: string): Promise<Checkin[]> {
    return this.repositorio.find({
      where: { paciente: { id: pacienteId }, data: MoreThanOrEqual(desde) },
      order: { data: 'DESC' },
    });
  }

  buscarDoDia(pacienteId: string, data: string): Promise<Checkin | null> {
    return this.repositorio.findOne({
      where: { paciente: { id: pacienteId }, data },
    });
  }
}
