import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { rotaAposEntrar, useSessao } from '../sessao/SessaoContext';
import { cores } from '../tema/tema';

/** Ponto de entrada: restaura a sessão salva e decide a primeira tela. */
export default function Inicio() {
  const { carregando, usuario } = useSessao();
  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator
          color={cores.primaria}
          accessibilityLabel="Carregando"
        />
      </View>
    );
  }
  return <Redirect href={usuario ? rotaAposEntrar(usuario) : '/login'} />;
}
