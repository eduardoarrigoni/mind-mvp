import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ObjetoPersistente } from '../database/persistencia/objeto-persistente.js';
import { Paciente } from '../usuarios/usuario.entity.js';

/** numeric do PostgreSQL chega como string; converte para number. */
const numero = {
  to: (valor: number) => valor,
  from: (valor: string | null) => (valor === null ? null : Number(valor)),
};

/** UC04 – check-in diário do paciente (um por dia, no fuso do app). */
@Entity('checkin')
@Unique('UQ_checkin_paciente_data', ['paciente', 'data'])
@Check('CHK_checkin_humor', '"humor" BETWEEN 1 AND 5')
@Check('CHK_checkin_energia', '"energia" BETWEEN 1 AND 5')
@Check('CHK_checkin_horas_sono', '"horas_sono" BETWEEN 0 AND 24')
export class Checkin extends ObjetoPersistente {
  @ManyToOne(() => Paciente, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  /** Dia do check-in (AAAA-MM-DD) no fuso do app (America/Sao_Paulo). */
  @Column({ type: 'date' })
  data: string;

  @Column({ type: 'smallint' })
  humor: number;

  @Column({ type: 'smallint' })
  energia: number;

  @Column({
    name: 'horas_sono',
    type: 'numeric',
    precision: 3,
    scale: 1,
    transformer: numero,
  })
  horasSono: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  observacao: string | null;
}
