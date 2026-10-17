/**
 * Cliente HTTP da API do Mind.
 * URL base: variável EXPO_PUBLIC_API_URL (ex.: http://192.168.0.10:3000 para testar
 * no celular pela rede local); padrão http://localhost:3000 (Expo web).
 */
export const URL_API = (
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '');

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ErroApi';
  }
}

type Opcoes = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  corpo?: unknown;
  token?: string | null;
};

/** Extrai uma mensagem legível do corpo de erro do NestJS. */
export function mensagemDeErro(corpo: unknown, status: number): string {
  if (corpo && typeof corpo === 'object' && 'message' in corpo) {
    const { message } = corpo as { message: unknown };
    if (Array.isArray(message)) return message.join('\n');
    if (typeof message === 'string') return message;
  }
  if (status === 0) return 'Não foi possível conectar ao servidor.';
  return `Erro inesperado (${status}). Tente novamente.`;
}

export async function requisicao<T>(
  caminho: string,
  { metodo = 'GET', corpo, token }: Opcoes = {},
): Promise<T> {
  const cabecalhos: Record<string, string> = { Accept: 'application/json' };
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${URL_API}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi(0, mensagemDeErro(null, 0));
  }

  const texto = await resposta.text();
  let dados: unknown = null;
  try {
    dados = texto ? JSON.parse(texto) : null;
  } catch {
    dados = texto;
  }
  if (!resposta.ok) {
    throw new ErroApi(resposta.status, mensagemDeErro(dados, resposta.status));
  }
  return dados as T;
}
