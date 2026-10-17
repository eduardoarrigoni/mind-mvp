import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DAOTypeORM } from '../database/persistencia/dao-typeorm.js';
import { Usuario } from './usuario.entity.js';

@Injectable()
export class UsuarioDAO extends DAOTypeORM<Usuario> {
  constructor(@InjectRepository(Usuario) repositorio: Repository<Usuario>) {
    super(repositorio);
  }

  /** Busca por e-mail (normalizado em minúsculas), opcionalmente trazendo o hash da senha. */
  buscarPorEmail(email: string, comSenha = false): Promise<Usuario | null> {
    const consulta = this.repositorio
      .createQueryBuilder('usuario')
      .where('usuario.email = :email', { email: email.trim().toLowerCase() });
    if (comSenha) consulta.addSelect('usuario.senhaHash');
    return consulta.getOne();
  }
}
