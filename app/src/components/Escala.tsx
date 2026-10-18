import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores, espaco, fonte, raio } from '../tema/tema';

type Props = {
  rotulo: string;
  valor: number | null;
  onAlterar: (valor: number) => void;
  /** Legendas dos extremos (1 e 5). */
  extremos: [string, string];
};

const OPCOES = [1, 2, 3, 4, 5];

/** Seletor de 1 a 5 em um toque (grupo de rádio acessível). */
export function Escala({ rotulo, valor, onAlterar, extremos }: Props) {
  return (
    <View
      style={estilos.grupo}
      accessibilityRole="radiogroup"
      accessibilityLabel={rotulo}
    >
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <View style={estilos.linha}>
        {OPCOES.map((n) => {
          const marcado = valor === n;
          return (
            <Pressable
              key={n}
              accessibilityRole="radio"
              accessibilityState={{ checked: marcado }}
              accessibilityLabel={`${rotulo} ${n}`}
              onPress={() => onAlterar(n)}
              style={[estilos.opcao, marcado && estilos.opcaoMarcada]}
            >
              <Text style={[estilos.numero, marcado && estilos.numeroMarcado]}>
                {n}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={estilos.legendas}>
        <Text style={estilos.legenda}>{extremos[0]}</Text>
        <Text style={estilos.legenda}>{extremos[1]}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espaco.xs },
  rotulo: { fontSize: fonte.pequeno, fontWeight: '600', color: cores.texto },
  linha: { flexDirection: 'row', gap: espaco.sm },
  opcao: {
    flex: 1,
    minHeight: 48,
    borderRadius: raio.sm,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcaoMarcada: {
    backgroundColor: cores.primaria,
    borderColor: cores.primaria,
  },
  numero: { fontSize: fonte.subtitulo, fontWeight: '600', color: cores.texto },
  numeroMarcado: { color: cores.superficie },
  legendas: { flexDirection: 'row', justifyContent: 'space-between' },
  legenda: { fontSize: fonte.pequeno, color: cores.textoSuave },
});
