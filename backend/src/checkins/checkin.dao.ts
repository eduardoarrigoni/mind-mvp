import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DAOTypeORM } from '../database/persistencia/dao-typeorm.js';
import { Checkin } from './checkin.entity.js';

@Injectable()
export class CheckinDAO extends DAOTypeORM<Checkin> {
  constructor(@InjectRepository(Checkin) repositorio: Repository<Checkin>) {
    super(repositorio);
  }

  buscarDoDia(pacienteId: string, data: string): Promise<Checkin | null> {
    return this.repositorio.findOne({
      where: { paciente: { id: pacienteId }, data },
    });
  }
}
