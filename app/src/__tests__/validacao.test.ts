import {
  dataParaIso,
  mascararData,
  temErros,
  validarCadastro,
  validarLogin,
} from '../sessao/validacao';

const valido = {
  nome: 'Ana Lima',
  email: 'ana@mind.app',
  dataNascimento: '15/03/2001',
  senha: 'senhaForte1',
  confirmacao: 'senhaForte1',
};
const hoje = new Date('2026-10-17T12:00:00Z');

describe('validação dos formulários de acesso', () => {
  it('cadastro válido não tem erros', () => {
    expect(temErros(validarCadastro(valido, hoje))).toBe(false);
  });

  it.each([
    ['nome vazio', { nome: '  ' }, 'nome', 'Informe o nome.'],
    [
      'e-mail inválido',
      { email: 'ana@' },
      'email',
      'Informe um e-mail válido.',
    ],
    [
      'data inexistente',
      { dataNascimento: '31/02/2001' },
      'dataNascimento',
      'Informe uma data válida no formato DD/MM/AAAA.',
    ],
    [
      'data no futuro',
      { dataNascimento: '01/01/2030' },
      'dataNascimento',
      'A data de nascimento não pode estar no futuro.',
    ],
    [
      'senha curta',
      { senha: '1234567', confirmacao: '1234567' },
      'senha',
      'A senha deve ter ao menos 8 caracteres.',
    ],
    [
      'confirmação diferente',
      { confirmacao: 'outraSenha1' },
      'confirmacao',
      'As senhas não conferem.',
    ],
  ])('cadastro: %s', (_caso, alteracao, campo, mensagem) => {
    const erros = validarCadastro({ ...valido, ...alteracao }, hoje);
    expect(erros).toEqual({ [campo]: mensagem });
  });

  it('login exige e-mail e senha', () => {
    expect(validarLogin('', '')).toEqual({
      email: 'Informe o e-mail.',
      senha: 'Informe a senha.',
    });
    expect(validarLogin('ana@mind.app', 'x')).toEqual({});
  });

  it('converte DD/MM/AAAA para ISO e aplica a máscara', () => {
    expect(dataParaIso('15/03/2001')).toBe('2001-03-15');
    expect(dataParaIso('2001-03-15')).toBeNull();
    expect(mascararData('15032001')).toBe('15/03/2001');
    expect(mascararData('15a03')).toBe('15/03');
  });
});
