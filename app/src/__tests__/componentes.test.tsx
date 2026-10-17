import { fireEvent, render, screen } from '@testing-library/react-native';
import { Botao } from '../components/Botao';
import { CampoTexto } from '../components/CampoTexto';

describe('componentes base', () => {
  it('Botao chama onPress quando habilitado', async () => {
    const aoPressionar = jest.fn();
    await render(<Botao titulo="Entrar" onPress={aoPressionar} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(aoPressionar).toHaveBeenCalledTimes(1);
  });

  it('Botao desabilitado não dispara onPress', async () => {
    const aoPressionar = jest.fn();
    await render(<Botao titulo="Entrar" onPress={aoPressionar} desabilitado />);
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(aoPressionar).not.toHaveBeenCalled();
  });

  it('CampoTexto exibe rótulo acessível e mensagem de erro', async () => {
    await render(
      <CampoTexto rotulo="E-mail" erro="Informe um e-mail válido." />,
    );
    expect(screen.getByLabelText('E-mail')).toBeTruthy();
    expect(screen.getByText('Informe um e-mail válido.')).toBeTruthy();
  });
});
