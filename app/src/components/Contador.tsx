import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores, espaco, fonte, raio } from '../tema/tema';

type Props = {
  rotulo: string;
  valor: number;
  onAlterar: (valor: number) => void;
  minimo: number;
  maximo: number;
  passo: number;
  unidade: string;
};

const formatar = (n: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Ajuste rápido de um número com botões − e + (ex.: horas de sono). */
export function Contador({
  rotulo,
  valor,
  onAlterar,
  minimo,
  maximo,
  passo,
  unidade,
}: Props) {
  const alterar = (delta: number) =>
    onAlterar(
      Math.min(maximo, Math.max(minimo, Math.round((valor + delta) * 10) / 10)),
    );

  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <View style={estilos.linha}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Diminuir ${rotulo}`}
          accessibilityState={{ disabled: valor <= minimo }}
          disabled={valor <= minimo}
          onPress={() => alterar(-passo)}
          style={estilos.botao}
        >
          <Text style={estilos.sinal}>−</Text>
        </Pressable>
        <Text
          style={estilos.valor}
          accessibilityLabel={`${rotulo}: ${formatar(valor)} ${unidade}`}
        >
          {formatar(valor)} {unidade}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Aumentar ${rotulo}`}
          accessibilityState={{ disabled: valor >= maximo }}
          disabled={valor >= maximo}
          onPress={() => alterar(passo)}
          style={estilos.botao}
        >
          <Text style={estilos.sinal}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espaco.xs },
  rotulo: { fontSize: fonte.pequeno, fontWeight: '600', color: cores.texto },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  botao: {
    width: 48,
    height: 48,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.superficie,
  },
  sinal: { fontSize: fonte.titulo, color: cores.primaria, lineHeight: 30 },
  valor: {
    flex: 1,
    textAlign: 'center',
    fontSize: fonte.subtitulo,
    fontWeight: '600',
    color: cores.texto,
  },
});
