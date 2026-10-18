import { router } from 'expo-router';
import { useState } from 'react';
import { ErroApi } from '../api/cliente';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { CampoTexto } from '../components/CampoTexto';
import { Tela } from '../components/Tela';
import { rotaAposEntrar, useSessao } from '../sessao/SessaoContext';
import { temErros, validarLogin } from '../sessao/validacao';

/** UC01 – login do paciente. */
export default function Login() {
  const { entrar } = useSessao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erros, setErros] = useState<ReturnType<typeof validarLogin>>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    const encontrados = validarLogin(email, senha);
    setErros(encontrados);
    setErroApi(null);
    if (temErros(encontrados)) return;

    setEnviando(true);
    try {
      const usuario = await entrar(email, senha);
      router.replace(rotaAposEntrar(usuario));
    } catch (erro) {
      setErroApi(
        erro instanceof ErroApi ? erro.message : 'Não foi possível entrar.',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela
      titulo="Mind"
      subtitulo="Acompanhe sua saúde mental, um dia de cada vez."
    >
      <Aviso mensagem={erroApi} />
      <CampoTexto
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        erro={erros.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <CampoTexto
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        erro={erros.senha}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={enviar}
      />
      <Botao titulo="Entrar" onPress={enviar} carregando={enviando} />
      <Botao
        titulo="Criar conta"
        variante="secundario"
        onPress={() => router.push('/cadastro')}
      />
    </Tela>
  );
}
