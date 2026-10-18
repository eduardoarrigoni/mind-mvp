import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { apiAuth, Usuario } from '../api/auth';
import { ErroApi } from '../api/cliente';
import { apiTcle } from '../api/tcle';
import Home from '../app/home';
import Tcle from '../app/tcle';
import { SessaoProvider } from '../sessao/SessaoContext';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    router: { replace: jest.fn(), push: jest.fn() },
    Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
  };
});
jest.mock('../api/auth', () => ({
  apiAuth: { entrar: jest.fn(), cadastrar: jest.fn(), perfil: jest.fn() },
}));
jest.mock('../api/tcle', () => ({
  apiTcle: { vigente: jest.fn(), aceitar: jest.fn() },
}));

const auth = apiAuth as jest.Mocked<typeof apiAuth>;
const tcle = apiTcle as jest.Mocked<typeof apiTcle>;

const usuario = (tcleAceito: boolean): Usuario => ({
  id: 'u1',
  nome: 'Ana Lima',
  email: 'ana@mind.app',
  papel: 'PACIENTE',
  tcleAceito,
});

const termo = {
  versao: '1.0',
  texto: 'O Mind não substitui atendimento profissional.',
  vigenteDesde: '2026-10-17T00:00:00Z',
};

/** Renderiza com uma sessão salva (token + perfil) já restaurada. */
async function renderizarLogado(tela: React.ReactElement, aceito = false) {
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('jwt-1');
  auth.perfil.mockResolvedValue(usuario(aceito));
  await render(<SessaoProvider>{tela}</SessaoProvider>);
}

const botaoAceite = () => screen.getByRole('button', { name: 'Li e aceito' });

beforeEach(() => {
  jest.clearAllMocks();
  tcle.vigente.mockResolvedValue(termo);
});

describe('tela do TCLE (PB09)', () => {
  it('exibe texto e versão do termo vigente', async () => {
    await renderizarLogado(<Tcle />);
    expect(await screen.findByText(termo.texto)).toBeTruthy();
    expect(screen.getByText('Versão 1.0')).toBeTruthy();
  });

  it('"Li e aceito" só habilita depois de marcar a confirmação', async () => {
    await renderizarLogado(<Tcle />);
    await screen.findByText(termo.texto);

    expect(botaoAceite().props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(botaoAceite());
    expect(tcle.aceitar).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole('checkbox'));
    expect(botaoAceite().props.accessibilityState.disabled).toBe(false);
  });

  it('registra o aceite na API, atualiza o perfil e vai para a Home', async () => {
    tcle.aceitar.mockResolvedValue({ versao: '1.0', aceitoEm: 'agora' });
    await renderizarLogado(<Tcle />);
    await screen.findByText(termo.texto);

    auth.perfil.mockResolvedValue(usuario(true));
    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(botaoAceite());

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/home'));
    expect(tcle.aceitar).toHaveBeenCalledWith('jwt-1', '1.0');
    expect(auth.perfil).toHaveBeenCalledTimes(2);
  });

  it('termo atualizado durante a leitura (409): mostra o aviso e pede nova confirmação', async () => {
    tcle.aceitar.mockRejectedValue(
      new ErroApi(
        409,
        'O termo foi atualizado. Leia a versão vigente antes de aceitar.',
      ),
    );
    await renderizarLogado(<Tcle />);
    await screen.findByText(termo.texto);

    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(botaoAceite());

    expect(
      await screen.findByText(
        'O termo foi atualizado. Leia a versão vigente antes de aceitar.',
      ),
    ).toBeTruthy();
    expect(tcle.vigente).toHaveBeenCalledTimes(2);
    expect(botaoAceite().props.accessibilityState.disabled).toBe(true);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('falha ao carregar o termo: mostra erro e permite tentar de novo', async () => {
    tcle.vigente.mockRejectedValueOnce(
      new ErroApi(0, 'Não foi possível conectar ao servidor.'),
    );
    await renderizarLogado(<Tcle />);

    expect(
      await screen.findByText('Não foi possível conectar ao servidor.'),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );
    expect(await screen.findByText(termo.texto)).toBeTruthy();
  });

  it('aceite já registrado: o termo não é solicitado de novo', async () => {
    await renderizarLogado(<Tcle />, true);
    expect(await screen.findByText('redirect:/home')).toBeTruthy();
  });

  it('sem aceite o paciente não acessa a Home', async () => {
    await renderizarLogado(<Home />, false);
    expect(await screen.findByText('redirect:/tcle')).toBeTruthy();
  });
});
