import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { cores, espaco, fonte, raio } from '../tema/tema';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario';
  desabilitado?: boolean;
  carregando?: boolean;
};

export function Botao({
  titulo,
  onPress,
  variante = 'primario',
  desabilitado = false,
  carregando = false,
}: Props) {
  const inativo = desabilitado || carregando;
  const primario = variante === 'primario';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: carregando }}
      disabled={inativo}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        primario ? estilos.primario : estilos.secundario,
        pressed &&
          !inativo &&
          (primario
            ? estilos.primarioPressionado
            : estilos.secundarioPressionado),
        inativo && estilos.inativo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator
          color={primario ? cores.superficie : cores.primaria}
        />
      ) : (
        <Text style={[estilos.texto, !primario && estilos.textoSecundario]}>
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: raio.md,
    paddingHorizontal: espaco.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: { backgroundColor: cores.primaria },
  primarioPressionado: { backgroundColor: cores.primariaEscura },
  secundario: {
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.primaria,
  },
  secundarioPressionado: { backgroundColor: cores.fundo },
  inativo: { opacity: 0.5 },
  texto: { color: cores.superficie, fontSize: fonte.corpo, fontWeight: '600' },
  textoSecundario: { color: cores.primaria },
});
