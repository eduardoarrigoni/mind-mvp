import { router } from 'expo-router';
import { Text } from 'react-native';
import { Botao } from '../components/Botao';
import { Tela } from '../components/Tela';

// Estrutura de navegação (PB04). O check-in diário entra no PB13.
export default function Home() {
  return (
    <Tela titulo="Olá!" subtitulo="Como você está hoje?">
      <Text>O check-in diário aparecerá aqui.</Text>
      <Botao
        titulo="Sair"
        variante="secundario"
        onPress={() => router.replace('/login')}
      />
    </Tela>
  );
}
