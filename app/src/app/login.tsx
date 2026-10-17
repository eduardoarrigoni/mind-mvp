import { router } from 'expo-router';
import { Botao } from '../components/Botao';
import { CampoTexto } from '../components/CampoTexto';
import { Tela } from '../components/Tela';

// Estrutura de navegação (PB04). A autenticação real entra no PB08.
export default function Login() {
  return (
    <Tela
      titulo="Mind"
      subtitulo="Acompanhe sua saúde mental, um dia de cada vez."
    >
      <CampoTexto
        rotulo="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <CampoTexto rotulo="Senha" secureTextEntry />
      <Botao titulo="Entrar" onPress={() => router.push('/tcle')} />
      <Botao
        titulo="Criar conta"
        variante="secundario"
        onPress={() => router.push('/cadastro')}
      />
    </Tela>
  );
}
