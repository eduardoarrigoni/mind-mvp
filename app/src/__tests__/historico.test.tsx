import { fireEvent, render, screen } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { apiAuth } from '../api/auth';
import { apiCheckins, Checkin } from '../api/checkins';
import { ErroApi } from '../api/cliente';
import Historico from '../app/historico';
import Home from '../app/home';
import { formatarData, formatarHoras } from '../checkin/formatacao';
import { SessaoProvider } from '../sessao/SessaoContext';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
  },
  Redirect: () => null,
}));
jest.mock('../api/auth', () => ({
  apiAuth: { entrar: jest.fn(), cadastrar: jest.fn(), perfil: jest.fn() },
}));
jest.mock('../api/checkins', () => ({
  apiCheckins: {
    deHoje: jest.fn(),
    registrar: jest.fn(),
    historico: jest.fn(),
  },
}));

const api = apiCheckins as jest.Mocked<typeof apiCheckins>;

const lista: Checkin[] = [
  {
    id: 'c2',
    data: '2026-10-18',
    humor: 4,
    energia: 3,
    horasSono: 7.5,
    observacao: 'Dia tranquilo',
  },
  {
    id: 'c1',
    data: '2026-10-15',
    humor: 2,
    energia: 2,
    horasSono: 5,
    observacao: null,
  },
];

async function abrir(tela: React.ReactElement) {
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('jwt-1');
  (apiAuth.perfil as jest.Mock).mockResolvedValue({
    id: 'u1',
    nome: 'Ana Lima',
    email: 'ana@mind.app',
    papel: 'PACIENTE',
    tcleAceito: true,
  });
  await render(<SessaoProvider>{tela}</SessaoProvider>);
}

beforeEach(() => jest.clearAllMocks());

describe('tela de histórico (PB14)', () => {
  it('lista os check-ins por data com humor, energia, sono e observação', async () => {
    api.historico.mockResolvedValue(lista);
    await abrir(<Historico />);

    expect(await screen.findByText('dom, 18/10/2026')).toBeTruthy();
    expect(
      screen.getByText('Humor 4/5 · Energia 3/5 · Sono 7,5 h'),
    ).toBeTruthy();
    expect(screen.getByText('“Dia tranquilo”')).toBeTruthy();
    expect(screen.getByText('qui, 15/10/2026')).toBeTruthy();
    expect(screen.getByText('Humor 2/5 · Energia 2/5 · Sono 5 h')).toBeTruthy();
    expect(api.historico).toHaveBeenCalledWith('jwt-1', 30);

    // Ordem da API preservada: mais recente primeiro.
    const datas = screen
      .getAllByText(/\d{2}\/\d{2}\/\d{4}$/)
      .map((t) => t.props.children);
    expect(datas).toEqual(['dom, 18/10/2026', 'qui, 15/10/2026']);
  });

  it('mostra apenas dados brutos – sem escores, médias ou tendências (R07)', async () => {
    api.historico.mockResolvedValue(lista);
    await abrir(<Historico />);
    await screen.findByText('dom, 18/10/2026');

    expect(
      screen.queryByText(/média|tendência|escore|pontuação|melhorou|piorou/i),
    ).toBeNull();
  });

  it('estado vazio convida a fazer o primeiro check-in', async () => {
    api.historico.mockResolvedValue([]);
    await abrir(<Historico />);

    expect(
      await screen.findByText(/ainda não tem check-ins nos últimos 30 dias/),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Fazer meu primeiro check-in' }),
    );
    expect(router.replace).toHaveBeenCalledWith('/home');
  });

  it('erro ao carregar: mostra a mensagem e permite tentar de novo', async () => {
    api.historico
      .mockRejectedValueOnce(
        new ErroApi(0, 'Não foi possível conectar ao servidor.'),
      )
      .mockResolvedValueOnce(lista);
    await abrir(<Historico />);

    expect(
      await screen.findByText('Não foi possível conectar ao servidor.'),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    );
    expect(await screen.findByText('dom, 18/10/2026')).toBeTruthy();
  });

  it('a Home leva ao histórico', async () => {
    api.deHoje.mockResolvedValue(null);
    await abrir(<Home />);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Ver meu histórico' }),
    );
    expect(router.push).toHaveBeenCalledWith('/historico');
  });

  it('"Voltar" retorna à tela anterior', async () => {
    api.historico.mockResolvedValue([]);
    await abrir(<Historico />);
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Voltar' }),
    );
    expect(router.back).toHaveBeenCalled();
  });
});

describe('formatação', () => {
  it('data com dia da semana e horas com vírgula', () => {
    expect(formatarData('2026-10-19')).toBe('seg, 19/10/2026');
    expect(formatarHoras(7.5)).toBe('7,5');
    expect(formatarHoras(8)).toBe('8');
  });
});
