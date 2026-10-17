import { FindOptionsWhere, Repository } from 'typeorm';
import { DAO } from './dao.js';
import { ObjetoPersistente } from './objeto-persistente.js';

/** Implementação genérica do DAO sobre um Repository do TypeORM. */
export class DAOTypeORM<T extends ObjetoPersistente> implements DAO<T> {
  constructor(protected readonly repositorio: Repository<T>) {}

  salvar(objeto: T): Promise<T> {
    return this.repositorio.save(objeto);
  }

  buscarPorId(id: string): Promise<T | null> {
    return this.repositorio.findOneBy({ id } as FindOptionsWhere<T>);
  }

  listar(): Promise<T[]> {
    return this.repositorio.find();
  }

  async remover(id: string): Promise<void> {
    await this.repositorio.delete(id);
  }
}
