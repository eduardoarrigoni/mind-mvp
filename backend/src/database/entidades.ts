import { Checkin } from '../checkins/checkin.entity.js';
import {
  AceiteTcle,
  TermoConsentimento,
} from '../consentimento/consentimento.entity.js';
import { Paciente, Profissional, Usuario } from '../usuarios/usuario.entity.js';

/** Registro explícito de todas as entidades mapeadas. */
export const ENTIDADES = [
  Usuario,
  Paciente,
  Profissional,
  TermoConsentimento,
  AceiteTcle,
  Checkin,
];
