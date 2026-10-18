import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ErroApi } from '../api/cliente';
import { apiTcle, Termo } from '../api/tcle';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { Confirmacao } from '../components/Confirmacao';
import { Tela } from '../components/Tela';
import { useSessao } from '../sessao/SessaoContext';
import { cores, espaco, fonte, raio } from '../tema/tema';

const mensagem = (erro: unknown, padrao: string) =>
  erro instanceof ErroApi ? erro.message : padrao;

/** UC13 – leitura e aceite explícito do TCLE vigente. */
export default function Tcle() {
  const { usuario, token, sair, atualizarPerfil } = useSessao();
  const [termo, setTermo] = useState<Termo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  /** Incrementado para (re)carregar o termo vigente. */
  const [carga, setCarga] = useState(0);

  useEffect(() => {
    let ativo = true;
    apiTcle
      .vigente()
      .then((t) => ativo && setTermo(t))
      .catch(
        (e) =>
          ativo && setErro(mensagem(e, 'Não foi possível carregar o termo.')),
      );
    return () => {
      ativo = false;
    };
  }, [carga]);

  /** Nova tentativa limpa a tela; após um 409 mantém o aviso e o termo até a nova versão chegar. */
  const recarregar = useCallback((aposConflito = false) => {
    if (!aposConflito) {
      setErro(null);
      setTermo(null);
    }
    setCarga((n) => n + 1);
  }, []);

  if (!usuario || !token) return <Redirect href="/login" />;
  // Aceite já registrado: o termo não é solicitado novamente.
  if (usuario.tcleAceito) return <Redirect href="/home" />;

  async function aceitar() {
    if (!termo || !token) return;
    setEnviando(true);
    setErro(null);
    try {
      await apiTcle.aceitar(token, termo.versao);
      await atualizarPerfil();
      router.replace('/home');
    } catch (e) {
      // 409: o termo mudou enquanto a tela estava aberta – recarrega a nova versão.
      if (e instanceof ErroApi && e.status === 409) {
        setConfirmado(false);
        recarregar(true);
      }
      setErro(mensagem(e, 'Não foi possível registrar o aceite.'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela
      titulo="Termo de Consentimento"
      subtitulo="Leia com atenção antes de continuar."
    >
      <Aviso mensagem={erro} />
      {termo ? (
        <>
          <Text style={estilos.versao}>Versão {termo.versao}</Text>
          <View style={estilos.caixaTexto}>
            <Text style={estilos.texto}>{termo.texto}</Text>
          </View>
          <Confirmacao
            rotulo="Li e entendi o termo de consentimento."
            marcado={confirmado}
            onAlterar={setConfirmado}
          />
          <Botao
            titulo="Li e aceito"
            onPress={aceitar}
            desabilitado={!confirmado}
            carregando={enviando}
          />
        </>
      ) : erro ? (
        <Botao titulo="Tentar novamente" onPress={() => recarregar()} />
      ) : (
        <ActivityIndicator
          color={cores.primaria}
          accessibilityLabel="Carregando o termo"
        />
      )}
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

const estilos = StyleSheet.create({
  versao: { fontSize: fonte.pequeno, color: cores.textoSuave },
  caixaTexto: {
    padding: espaco.md,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  texto: { fontSize: fonte.corpo, lineHeight: 24, color: cores.texto },
});
