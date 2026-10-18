import { requisicao } from './cliente';

export type Papel = 'PACIENTE' | 'PROFISSIONAL';

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  dataNascimento?: string | null;
  tcleAceito: boolean;
};

export type Sessao = { accessToken: string; usuario: Usuario };

export type DadosCadastro = {
  nome: string;
  email: string;
  /** AAAA-MM-DD */
  dataNascimento: string;
  senha: string;
};

export const apiAuth = {
  cadastrar: (dados: DadosCadastro) =>
    requisicao<Omit<Usuario, 'tcleAceito'>>('/auth/cadastro', {
      metodo: 'POST',
      corpo: dados,
    }),

  entrar: (email: string, senha: string) =>
    requisicao<Sessao>('/auth/login', {
      metodo: 'POST',
      corpo: { email, senha },
    }),

  perfil: (token: string) => requisicao<Usuario>('/auth/me', { token }),
};
