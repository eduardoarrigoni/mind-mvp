import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { cores, espaco, fonte, raio } from '../tema/tema';

type Props = TextInputProps & {
  rotulo: string;
  erro?: string | null;
};

/** Campo de formulário com rótulo e mensagem de erro acessíveis. */
export function CampoTexto({ rotulo, erro, style, ...props }: Props) {
  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <TextInput
        accessibilityLabel={rotulo}
        placeholderTextColor={cores.textoSuave}
        style={[estilos.campo, erro ? estilos.campoComErro : null, style]}
        {...props}
      />
      {erro ? (
        <Text accessibilityLiveRegion="polite" style={estilos.erro}>
          {erro}
        </Text>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { gap: espaco.xs },
  rotulo: { fontSize: fonte.pequeno, fontWeight: '600', color: cores.texto },
  campo: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.sm,
    paddingHorizontal: espaco.md,
    fontSize: fonte.corpo,
    color: cores.texto,
    backgroundColor: cores.superficie,
  },
  campoComErro: { borderColor: cores.erro },
  erro: { fontSize: fonte.pequeno, color: cores.erro },
});
