import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { apiCheckins, Checkin, DadosCheckin } from '../api/checkins';
import { ErroApi } from '../api/cliente';
import { FormularioCheckin } from '../checkin/FormularioCheckin';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { Tela } from '../components/Tela';
import { useSessao } from '../sessao/SessaoContext';
import { cores, espaco, fonte, raio } from '../tema/tema';

type Retorno = { tipo: 'erro' | 'sucesso'; mensagem: string } | null;

const mensagem = (erro: unknown, padrao: string) =>
  erro instanceof ErroApi ? erro.message : padrao;

/** Home com o check-in rápido do dia (UC04 / R06). */
export default function Home() {
  const { usuario, token, sair } = useSessao();
  const [hoje, setHoje] = useState<Checkin | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [retorno, setRetorno] = useState<Retorno>(null);

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    apiCheckins
      .deHoje(token)
      .then((c) => ativo && setHoje(c))
      .catch(
        (e) =>
          ativo &&
          setRetorno({
            tipo: 'erro',
            mensagem: mensagem(
              e,
              'Não foi possível carregar o check-in de hoje.',
            ),
          }),
      )
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [token]);

  if (!usuario || !token) return <Redirect href="/login" />;
  if (!usuario.tcleAceito) return <Redirect href="/tcle" />;

  async function enviar(dados: DadosCheckin) {
    if (!token) return;
    setEnviando(true);
    setRetorno(null);
    try {
      const atualizado = hoje !== null;
      setHoje(await apiCheckins.registrar(token, dados));
      setEditando(false);
      setRetorno({
        tipo: 'sucesso',
        mensagem: atualizado
          ? 'Check-in de hoje atualizado.'
          : 'Check-in registrado. Até amanhã!',
      });
    } catch (e) {
      setRetorno({
        tipo: 'erro',
        mensagem: mensagem(e, 'Não foi possível registrar o check-in.'),
      });
    } finally {
      setEnviando(false);
    }
  }

  const primeiroNome = usuario.nome.split(' ')[0];
  return (
    <Tela titulo={`Olá, ${primeiroNome}!`} subtitulo="Como você está hoje?">
      <Aviso mensagem={retorno?.mensagem} tipo={retorno?.tipo} />
      {carregando ? (
        <ActivityIndicator
          color={cores.primaria}
          accessibilityLabel="Carregando o check-in de hoje"
        />
      ) : hoje && !editando ? (
        <View
          style={estilos.resumo}
          accessibilityLabel="Check-in de hoje feito"
        >
          <Text style={estilos.resumoTitulo}>✓ Check-in de hoje feito</Text>
          <Text style={estilos.resumoTexto}>
            Humor {hoje.humor}/5 · Energia {hoje.energia}/5 · Sono{' '}
            {hoje.horasSono.toLocaleString('pt-BR')} h
          </Text>
          {hoje.observacao ? (
            <Text style={estilos.resumoTexto}>“{hoje.observacao}”</Text>
          ) : null}
          <Botao
            titulo="Editar check-in"
            variante="secundario"
            onPress={() => {
              setRetorno(null);
              setEditando(true);
            }}
          />
        </View>
      ) : (
        <FormularioCheckin
          inicial={hoje}
          enviando={enviando}
          onEnviar={enviar}
        />
      )}
      <Botao
        titulo="Ver meu histórico"
        variante="secundario"
        onPress={() => router.push('/historico')}
      />
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
  resumo: {
    gap: espaco.sm,
    padding: espaco.md,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.sucesso,
    backgroundColor: cores.superficie,
  },
  resumoTitulo: {
    fontSize: fonte.subtitulo,
    fontWeight: '700',
    color: cores.sucesso,
  },
  resumoTexto: { fontSize: fonte.corpo, color: cores.texto },
});
