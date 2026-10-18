import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { apiAuth } from '../api/auth';
import { apiCheckins, Checkin } from '../api/checkins';
import { ErroApi } from '../api/cliente';
import Home from '../app/home';
import { SessaoProvider } from '../sessao/SessaoContext';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
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

const checkinDeHoje: Checkin = {
  id: 'c1',
  data: '2026-10-18',
  humor: 2,
  energia: 3,
  horasSono: 6.5,
  observacao: 'Dormi mal',
};

async function abrirHome(hoje: Checkin | null = null) {
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('jwt-1');
  (apiAuth.perfil as jest.Mock).mockResolvedValue({
    id: 'u1',
    nome: 'Ana Lima',
    email: 'ana@mind.app',
    papel: 'PACIENTE',
    tcleAceito: true,
  });
  api.deHoje.mockResolvedValue(hoje);
  await render(
    <SessaoProvider>
      <Home />
    </SessaoProvider>,
  );
  await screen.findByText('Olá, Ana!');
}

const botao = (nome: string) => screen.getByRole('button', { name: nome });
const desabilitado = (nome: string) =>
  botao(nome).props.accessibilityState.disabled;

beforeEach(() => jest.clearAllMocks());

describe('check-in diário na Home (PB13)', () => {
  it('sem check-in hoje: mostra o formulário; "Registrar" só habilita com humor e energia', async () => {
    await abrirHome(null);
    await screen.findByRole('radio', { name: 'Humor 1' });

    expect(desabilitado('Registrar check-in')).toBe(true);
    await fireEvent.press(screen.getByRole('radio', { name: 'Humor 4' }));
    expect(desabilitado('Registrar check-in')).toBe(true);
    await fireEvent.press(screen.getByRole('radio', { name: 'Energia 3' }));
    expect(desabilitado('Registrar check-in')).toBe(false);
    expect(
      screen.getByRole('radio', { name: 'Humor 4' }).props.accessibilityState
        .checked,
    ).toBe(true);
  });

  it('check-in rápido: 2 toques + "Registrar" envia e mostra o resumo do dia', async () => {
    api.registrar.mockImplementation(async (_t, dados) => ({
      ...checkinDeHoje,
      ...dados,
      observacao: dados.observacao ?? null,
    }));
    await abrirHome(null);
    await screen.findByRole('radio', { name: 'Humor 1' });

    await fireEvent.press(screen.getByRole('radio', { name: 'Humor 4' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Energia 5' }));
    await fireEvent.press(botao('Registrar check-in'));

    expect(api.registrar).toHaveBeenCalledWith('jwt-1', {
      humor: 4,
      energia: 5,
      horasSono: 8,
      observacao: null,
    });
    expect(
      await screen.findByText('Check-in registrado. Até amanhã!'),
    ).toBeTruthy();
    expect(screen.getByText('✓ Check-in de hoje feito')).toBeTruthy();
    expect(screen.getByText('Humor 4/5 · Energia 5/5 · Sono 8 h')).toBeTruthy();
  });

  it('ajusta horas de sono de meia em meia hora, dentro de 0–24, e envia observação', async () => {
    api.registrar.mockResolvedValue(checkinDeHoje);
    await abrirHome(null);
    await screen.findByRole('radio', { name: 'Humor 1' });

    await fireEvent.press(botao('Diminuir Horas de sono'));
    await fireEvent.press(botao('Diminuir Horas de sono'));
    await fireEvent.press(botao('Diminuir Horas de sono'));
    expect(screen.getByLabelText('Horas de sono: 6,5 h')).toBeTruthy();

    await fireEvent.press(screen.getByRole('radio', { name: 'Humor 3' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Energia 3' }));
    await fireEvent.changeText(
      screen.getByLabelText('Observação (opcional)'),
      '  Dia corrido  ',
    );
    expect(screen.getByText('15/500')).toBeTruthy();
    await fireEvent.press(botao('Registrar check-in'));

    expect(api.registrar).toHaveBeenCalledWith('jwt-1', {
      humor: 3,
      energia: 3,
      horasSono: 6.5,
      observacao: 'Dia corrido',
    });
  });

  it('check-in de hoje já feito: mostra o resumo e permite editar', async () => {
    api.registrar.mockResolvedValue({ ...checkinDeHoje, humor: 4 });
    await abrirHome(checkinDeHoje);

    expect(await screen.findByText('✓ Check-in de hoje feito')).toBeTruthy();
    expect(
      screen.getByText('Humor 2/5 · Energia 3/5 · Sono 6,5 h'),
    ).toBeTruthy();
    expect(screen.getByText('“Dormi mal”')).toBeTruthy();

    await fireEvent.press(botao('Editar check-in'));
    expect(
      screen.getByRole('radio', { name: 'Humor 2' }).props.accessibilityState
        .checked,
    ).toBe(true);
    await fireEvent.press(screen.getByRole('radio', { name: 'Humor 4' }));
    await fireEvent.press(botao('Atualizar check-in'));

    expect(
      await screen.findByText('Check-in de hoje atualizado.'),
    ).toBeTruthy();
    expect(api.registrar).toHaveBeenCalledWith(
      'jwt-1',
      expect.objectContaining({ humor: 4, energia: 3, horasSono: 6.5 }),
    );
  });

  it('erro da API é exibido e o formulário continua disponível', async () => {
    api.registrar.mockRejectedValue(
      new ErroApi(0, 'Não foi possível conectar ao servidor.'),
    );
    await abrirHome(null);
    await screen.findByRole('radio', { name: 'Humor 1' });

    await fireEvent.press(screen.getByRole('radio', { name: 'Humor 1' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Energia 1' }));
    await fireEvent.press(botao('Registrar check-in'));

    expect(
      await screen.findByText('Não foi possível conectar ao servidor.'),
    ).toBeTruthy();
    await waitFor(() => expect(desabilitado('Registrar check-in')).toBe(false));
  });

  it('falha ao carregar o check-in de hoje mostra aviso', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('jwt-1');
    (apiAuth.perfil as jest.Mock).mockResolvedValue({
      id: 'u1',
      nome: 'Ana',
      email: 'a@m.app',
      papel: 'PACIENTE',
      tcleAceito: true,
    });
    api.deHoje.mockRejectedValue(
      new ErroApi(500, 'Erro inesperado (500). Tente novamente.'),
    );
    await render(
      <SessaoProvider>
        <Home />
      </SessaoProvider>,
    );
    expect(
      await screen.findByText('Erro inesperado (500). Tente novamente.'),
    ).toBeTruthy();
  });
});
