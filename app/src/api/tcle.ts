import { requisicao } from './cliente';

export type Termo = { versao: string; texto: string; vigenteDesde: string };
export type Aceite = { versao: string; aceitoEm: string };

export const apiTcle = {
  vigente: () => requisicao<Termo>('/tcle/vigente'),

  aceitar: (token: string, versao: string) =>
    requisicao<Aceite>('/tcle/aceite', {
      metodo: 'POST',
      corpo: { versao },
      token,
    }),
};
