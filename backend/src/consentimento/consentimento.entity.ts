import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { ObjetoPersistente } from '../database/persistencia/objeto-persistente.js';
import { Usuario } from '../usuarios/usuario.entity.js';

/**
 * Versão do Termo de Consentimento Livre e Esclarecido (UC13).
 * O termo vigente é o de `vigenteDesde` mais recente que já começou a valer.
 */
@Entity('termo_consentimento')
@Unique('UQ_termo_consentimento_versao', ['versao'])
export class TermoConsentimento extends ObjetoPersistente {
  @Column({ type: 'varchar', length: 20 })
  versao: string;

  @Column({ type: 'text' })
  texto: string;

  @Column({ name: 'vigente_desde', type: 'timestamptz' })
  vigenteDesde: Date;
}

/** Aceite de uma versão do TCLE por um usuário (RN08 / LGPD). */
@Entity('aceite_tcle')
@Unique('UQ_aceite_tcle_usuario_termo', ['usuario', 'termo'])
export class AceiteTcle extends ObjetoPersistente {
  @ManyToOne(() => Usuario, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => TermoConsentimento, { nullable: false, eager: true })
  @JoinColumn({ name: 'termo_id' })
  termo: TermoConsentimento;

  @Column({ name: 'aceito_em', type: 'timestamptz', default: () => 'now()' })
  aceitoEm: Date;
}
