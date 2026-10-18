import { StyleSheet, Text } from 'react-native';
import { cores, espaco, fonte, raio } from '../tema/tema';

type Props = { mensagem?: string | null; tipo?: 'erro' | 'sucesso' };

/** Mensagem de retorno do formulário (ex.: erro devolvido pela API). */
export function Aviso({ mensagem, tipo = 'erro' }: Props) {
  if (!mensagem) return null;
  return (
    <Text
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[estilos.base, tipo === 'erro' ? estilos.erro : estilos.sucesso]}
    >
      {mensagem}
    </Text>
  );
}

const estilos = StyleSheet.create({
  base: {
    padding: espaco.md,
    borderRadius: raio.sm,
    fontSize: fonte.pequeno,
    borderWidth: 1,
  },
  erro: {
    color: cores.erro,
    borderColor: cores.erro,
    backgroundColor: '#FDECEA',
  },
  sucesso: {
    color: cores.sucesso,
    borderColor: cores.sucesso,
    backgroundColor: '#E8F5EC',
  },
});
