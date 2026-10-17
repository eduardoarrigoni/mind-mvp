import { ObjetoPersistente } from './objeto-persistente.js';

/** Contrato de acesso a dados usado pelas classes de aplicação (Apl...). */
export interface DAO<T extends ObjetoPersistente> {
  salvar(objeto: T): Promise<T>;
  buscarPorId(id: string): Promise<T | null>;
  listar(): Promise<T[]>;
  remover(id: string): Promise<void>;
}
