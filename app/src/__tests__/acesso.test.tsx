import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { ReactElement } from 'react';
import { apiAuth, Usuario } from '../api/auth';
import { ErroApi } from '../api/cliente';
import Cadastro from '../app/cadastro';
import Home from '../app/home';
import Login from '../app/login';
import { SessaoProvider } from '../sessao/SessaoContext';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
  Redirect: () => null,
}));
jest.mock('../api/auth', () => ({
  apiAuth: { entrar: jest.fn(), cadastrar: jest.fn(), perfil: jest.fn() },
}));

const api = apiAuth as jest.Mocked<typeof apiAuth>;

const usuario = (tcleAceito: boolean): Usuario => ({
  id: 'u1',
  nome: 'Ana Lima',
  email: 'ana@mind.app',
  papel: 'PACIENTE',
  tcleAceito,
});

const comSessao = (tela: ReactElement) =>
  render(<SessaoProvider>{tela}</SessaoProvider>);

async function preencherLogin(email: string, senha: string) {
  await fireEvent.changeText(screen.getByLabelText('E-mail'), email);
  await fireEvent.changeText(screen.getByLabelText('Senha'), senha);
  await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
}

beforeEach(() => jest.clearAllMocks());

describe('tela de login (PB08)', () => {
  it('valida os campos antes de chamar a API', async () => {
    await comSessao(<Login />);
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Informe o e-mail.')).toBeTruthy();
    expect(screen.getByText('Informe a senha.')).toBeTruthy();
    expect(api.entrar).not.toHaveBeenCalled();
  });

  it('TCLE pendente: salva o token no SecureStore e vai para o termo', async () => {
    api.entrar.mockResolvedValue({
      accessToken: 'jwt-1',
      usuario: usuario(false),
    });
    await comSessao(<Login />);
    await preencherLogin(' ana@mind.app ', 'senhaForte1');

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/tcle'));
    expect(api.entrar).toHaveBeenCalledWith('ana@mind.app', 'senhaForte1');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'mind.token',
      'jwt-1',
    );
  });

  it('TCLE já aceito: vai direto para a Home', async () => {
    api.entrar.mockResolvedValue({
      accessToken: 'jwt-1',
      usuario: usuario(true),
    });
    await comSessao(<Login />);
    await preencherLogin('ana@mind.app', 'senhaForte1');

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/home'));
  });

  it('mostra a mensagem da API em caso de credenciais inválidas', async () => {
    api.entrar.mockRejectedValue(
      new ErroApi(401, 'E-mail ou senha inválidos.'),
    );
    await comSessao(<Login />);
    await preencherLogin('ana@mind.app', 'errada123');

    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});

describe('tela de cadastro (PB08)', () => {
  async function preencher(campos: Record<string, string>) {
    for (const [rotulo, valor] of Object.entries(campos)) {
      await fireEvent.changeText(screen.getByLabelText(rotulo), valor);
    }
    await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));
  }

  const camposValidos = {
    Nome: 'Ana Lima',
    'E-mail': 'ana@mind.app',
    'Data de nascimento': '15032001',
    Senha: 'senhaForte1',
    'Confirme a senha': 'senhaForte1',
  };

  it('mostra erros de validação e não chama a API', async () => {
    await comSessao(<Cadastro />);
    await preencher({ ...camposValidos, 'Confirme a senha': 'outra' });

    expect(screen.getByText('As senhas não conferem.')).toBeTruthy();
    expect(api.cadastrar).not.toHaveBeenCalled();
  });

  it('cadastra com data em ISO, entra e segue para o TCLE', async () => {
    api.cadastrar.mockResolvedValue(usuario(false));
    api.entrar.mockResolvedValue({
      accessToken: 'jwt-2',
      usuario: usuario(false),
    });
    await comSessao(<Cadastro />);
    await preencher(camposValidos);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/tcle'));
    expect(api.cadastrar).toHaveBeenCalledWith({
      nome: 'Ana Lima',
      email: 'ana@mind.app',
      dataNascimento: '2001-03-15',
      senha: 'senhaForte1',
    });
  });

  it('mostra o erro de e-mail duplicado vindo da API', async () => {
    api.cadastrar.mockRejectedValue(
      new ErroApi(409, 'Já existe uma conta com este e-mail.'),
    );
    await comSessao(<Cadastro />);
    await preencher(camposValidos);

    expect(
      await screen.findByText('Já existe uma conta com este e-mail.'),
    ).toBeTruthy();
  });
});

describe('sessão (PB08)', () => {
  it('restaura a sessão salva e o botão Sair apaga o token', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('jwt-salvo');
    api.perfil.mockResolvedValue(usuario(true));
    await comSessao(<Home />);

    expect(await screen.findByText('Olá, Ana!')).toBeTruthy();
    expect(api.perfil).toHaveBeenCalledWith('jwt-salvo');

    await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'));
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('mind.token');
  });

  it('token salvo inválido (401) é descartado', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('expirado');
    api.perfil.mockRejectedValue(new ErroApi(401, 'Sessão inválida.'));
    await comSessao(<Home />);

    await waitFor(() =>
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('mind.token'),
    );
  });
});
