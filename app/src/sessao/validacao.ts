/** Validações dos formulários de acesso, espelhando as regras da API. */

export type Erros<C extends string> = Partial<Record<C, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarLogin(email: string, senha: string) {
  const erros: Erros<'email' | 'senha'> = {};
  if (!email.trim()) erros.email = 'Informe o e-mail.';
  if (!senha) erros.senha = 'Informe a senha.';
  return erros;
}

/** Converte "DD/MM/AAAA" em "AAAA-MM-DD"; null se a data não existir. */
export function dataParaIso(texto: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!partes) return null;
  const [, dia, mes, ano] = partes.map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  const existe =
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia;
  if (!existe) return null;
  return `${partes[3]}-${partes[2]}-${partes[1]}`;
}

/** Insere as barras enquanto o usuário digita a data (ex.: "1503" → "15/03"). */
export function mascararData(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  return [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4)]
    .filter(Boolean)
    .join('/');
}

export type CamposCadastro = {
  nome: string;
  email: string;
  dataNascimento: string;
  senha: string;
  confirmacao: string;
};

export function validarCadastro(
  campos: CamposCadastro,
  hoje: Date = new Date(),
) {
  const erros: Erros<keyof CamposCadastro> = {};
  if (!campos.nome.trim()) erros.nome = 'Informe o nome.';
  if (!EMAIL.test(campos.email.trim())) {
    erros.email = 'Informe um e-mail válido.';
  }

  const iso = dataParaIso(campos.dataNascimento);
  if (!iso) {
    erros.dataNascimento = 'Informe uma data válida no formato DD/MM/AAAA.';
  } else if (new Date(`${iso}T00:00:00Z`) > hoje) {
    erros.dataNascimento = 'A data de nascimento não pode estar no futuro.';
  }

  if (campos.senha.length < 8) {
    erros.senha = 'A senha deve ter ao menos 8 caracteres.';
  } else if (campos.senha.length > 72) {
    erros.senha = 'A senha deve ter no máximo 72 caracteres.';
  }
  if (campos.confirmacao !== campos.senha) {
    erros.confirmacao = 'As senhas não conferem.';
  }
  return erros;
}

export const temErros = (erros: object) => Object.keys(erros).length > 0;
