import { CriarUsuario1760731200000 } from './1760731200000-CriarUsuario.js';
import { CriarTcle1792284741048 } from './1792284741048-CriarTcle.js';
import { CriarCheckin1792360847370 } from './1792360847370-CriarCheckin.js';

/** Migrations em ordem de aplicação. Toda nova migration deve ser registrada aqui. */
export const MIGRACOES = [
  CriarUsuario1760731200000,
  CriarTcle1792284741048,
  CriarCheckin1792360847370,
];
