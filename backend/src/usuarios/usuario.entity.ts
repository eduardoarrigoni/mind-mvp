import {
  ChildEntity,
  Column,
  Entity,
  TableInheritance,
  Unique,
} from 'typeorm';
import { ObjetoPersistente } from '../database/persistencia/objeto-persistente.js';

export enum Papel {
  PACIENTE = 'PACIENTE',
  PROFISSIONAL = 'PROFISSIONAL',
}

/**
 * Usuário do sistema. Herança em tabela única (STI): Paciente e Profissional
 * compartilham a tabela `usuario`, discriminados pela coluna `papel`.
 */
@Entity('usuario')
@Unique('UQ_usuario_email', ['email'])
@TableInheritance({
  column: {
    name: 'papel',
    type: 'enum',
    enum: Papel,
  },
})
export class Usuario extends ObjetoPersistente {
  @Column({ type: 'varchar', length: 120 })
  nome: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @Column({ name: 'senha_hash', type: 'varchar', length: 100, select: false })
  senhaHash: string;

  /** Valor do discriminador; definido pelas subclasses (não é coluna própria). */
  get papel(): Papel | undefined {
    return undefined;
  }
}

@ChildEntity(Papel.PACIENTE)
export class Paciente extends Usuario {
  override get papel(): Papel {
    return Papel.PACIENTE;
  }

  @Column({ name: 'data_nascimento', type: 'date', nullable: true })
  dataNascimento: string | null;
}

@ChildEntity(Papel.PROFISSIONAL)
export class Profissional extends Usuario {
  override get papel(): Papel {
    return Papel.PROFISSIONAL;
  }

  @Column({
    name: 'registro_profissional',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  registroProfissional: string | null;
}
