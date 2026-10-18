import { Redirect, router } from 'expo-router';
import { Text } from 'react-native';
import { Botao } from '../components/Botao';
import { Tela } from '../components/Tela';
import { useSessao } from '../sessao/SessaoContext';

// O check-in diário entra no PB13.
export default function Home() {
  const { usuario, sair } = useSessao();
  if (!usuario) return <Redirect href="/login" />;
  if (!usuario.tcleAceito) return <Redirect href="/tcle" />;

  const primeiroNome = usuario.nome.split(' ')[0];
  return (
    <Tela titulo={`Olá, ${primeiroNome}!`} subtitulo="Como você está hoje?">
      <Text>O check-in diário aparecerá aqui.</Text>
      <Botao
        titulo="Sair"
        variante="secundario"
        onPress={async () => {
          await sair();
          router.replace('/login');
        }}
      />
    </Tela>
  );
}
