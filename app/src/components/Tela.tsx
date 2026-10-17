import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cores, espaco, fonte } from '../tema/tema';

type Props = {
  titulo?: string;
  subtitulo?: string;
  children: ReactNode;
};

/** Contêiner padrão das telas: área segura, rolagem e título opcional. */
export function Tela({ titulo, subtitulo, children }: Props) {
  return (
    <SafeAreaView style={estilos.area}>
      <ScrollView
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        {titulo ? (
          <Text accessibilityRole="header" style={estilos.titulo}>
            {titulo}
          </Text>
        ) : null}
        {subtitulo ? <Text style={estilos.subtitulo}>{subtitulo}</Text> : null}
        <View style={estilos.corpo}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  area: { flex: 1, backgroundColor: cores.fundo },
  conteudo: {
    flexGrow: 1,
    padding: espaco.lg,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  titulo: {
    fontSize: fonte.titulo,
    fontWeight: '700',
    color: cores.texto,
    marginBottom: espaco.xs,
  },
  subtitulo: {
    fontSize: fonte.corpo,
    color: cores.textoSuave,
    marginBottom: espaco.lg,
  },
  corpo: { gap: espaco.md },
});
