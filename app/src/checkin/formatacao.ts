const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** "2026-10-18" → "dom, 18/10/2026" (sem depender do Intl do dispositivo). */
export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.split('-');
  const semana = new Date(`${iso}T12:00:00Z`).getUTCDay();
  return `${DIAS_SEMANA[semana]}, ${dia}/${mes}/${ano}`;
}

/** 7.5 → "7,5" */
export const formatarHoras = (horas: number) => String(horas).replace('.', ',');
