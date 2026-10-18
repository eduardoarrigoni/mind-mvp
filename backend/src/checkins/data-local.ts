/** Fuso usado para definir "o dia" do check-in (os pacientes do piloto estão no Brasil). */
export const FUSO_APP = 'America/Sao_Paulo';

/** Data AAAA-MM-DD de `instante` no fuso informado. */
export function dataLocal(
  instante: Date = new Date(),
  fuso = FUSO_APP,
): string {
  // en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instante);
}
