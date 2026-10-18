import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores, espaco, fonte, raio } from '../tema/tema';

type Props = {
  rotulo: string;
  marcado: boolean;
  onAlterar: (marcado: boolean) => void;
};

/** Caixa de confirmação acessível (papel "checkbox"). */
export function Confirmacao({ rotulo, marcado, onAlterar }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcado }}
      accessibilityLabel={rotulo}
      onPress={() => onAlterar(!marcado)}
      style={estilos.linha}
    >
      <View style={[estilos.caixa, marcado && estilos.caixaMarcada]}>
        {marcado ? <Text style={estilos.marca}>✓</Text> : null}
      </View>
      <Text style={estilos.rotulo}>{rotulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    minHeight: 48,
  },
  caixa: {
    width: 24,
    height: 24,
    borderRadius: raio.sm / 2,
    borderWidth: 2,
    borderColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
  },
  caixaMarcada: { backgroundColor: cores.primaria },
  marca: { color: cores.superficie, fontWeight: '700' },
  rotulo: { flex: 1, fontSize: fonte.corpo, color: cores.texto },
});
