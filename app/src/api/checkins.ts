import { requisicao } from './cliente';

export type Checkin = {
  id: string;
  /** AAAA-MM-DD (dia no fuso do servidor, America/Sao_Paulo) */
  data: string;
  humor: number;
  energia: number;
  horasSono: number;
  observacao: string | null;
};

export type DadosCheckin = {
  humor: number;
  energia: number;
  horasSono: number;
  observacao?: string | null;
};

export const apiCheckins = {
  /** Cria o check-in do dia ou atualiza o já existente. */
  registrar: (token: string, dados: DadosCheckin) =>
    requisicao<Checkin>('/checkins', { metodo: 'POST', corpo: dados, token }),

  /** Histórico do próprio paciente, do mais recente ao mais antigo. */
  historico: (token: string, dias = 30) =>
    requisicao<Checkin[]>(`/checkins?dias=${dias}`, { token }),

  /** Check-in de hoje, se já existir (janela de 1 dia no servidor). */
  deHoje: async (token: string): Promise<Checkin | null> =>
    (await apiCheckins.historico(token, 1))[0] ?? null,
};
