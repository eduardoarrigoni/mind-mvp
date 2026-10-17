import { router } from 'expo-router';
import { Botao } from '../components/Botao';
import { CampoTexto } from '../components/CampoTexto';
import { Tela } from '../components/Tela';

// Estrutura de navegação (PB04). O cadastro real (POST /auth/cadastro) entra no PB08.
export default function Cadastro() {
  return (
    <Tela
      titulo="Criar conta"
      subtitulo="Seus dados ficam protegidos e só você decide quem os vê."
    >
      <CampoTexto rotulo="Nome" autoCapitalize="words" />
      <CampoTexto
        rotulo="E-mail"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <CampoTexto rotulo="Data de nascimento" placeholder="AAAA-MM-DD" />
      <CampoTexto
        rotulo="Senha"
        secureTextEntry
        placeholder="Mínimo de 8 caracteres"
      />
      <Botao titulo="Cadastrar" onPress={() => router.replace('/login')} />
      <Botao
        titulo="Já tenho conta"
        variante="secundario"
        onPress={() => router.back()}
      />
    </Tela>
  );
}
