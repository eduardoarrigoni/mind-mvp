import { router } from 'expo-router';
import { Text } from 'react-native';
import { Botao } from '../components/Botao';
import { Tela } from '../components/Tela';

// Estrutura de navegação (PB04). Texto vigente e aceite registrado entram no PB09.
export default function Tcle() {
  return (
    <Tela
      titulo="Termo de Consentimento"
      subtitulo="Leia com atenção antes de continuar."
    >
      <Text>O texto do TCLE vigente será carregado da API.</Text>
      <Botao titulo="Li e aceito" onPress={() => router.replace('/home')} />
    </Tela>
  );
}
