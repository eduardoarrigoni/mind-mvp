import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { apiCheckins, Checkin } from '../api/checkins';
import { ErroApi } from '../api/cliente';
import { formatarData, formatarHoras } from '../checkin/formatacao';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { Tela } from '../components/Tela';
import { useSessao } from '../sessao/SessaoContext';
import { cores, espaco, fonte, raio } from '../tema/tema';

const DIAS = 30;

/**
 * UC10 (parcial) – lista dos check-ins dos últimos 30 dias.
 * Mostra só os dados registrados, sem escores nem interpretação (R07).
 */
export default function Historico() {
  const { usuario, token } = useSessao();
  const [checkins, setCheckins] = useState<Checkin[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carga, setCarga] = useState(0);

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    apiCheckins
      .historico(token, DIAS)
      .then((lista) => ativo && setCheckins(lista))
      .catch(
        (e) =>
          ativo &&
          setErro(
            e instanceof ErroApi
              ? e.message
              : 'Não foi possível carregar o histórico.',
          ),
      );
    return () => {
      ativo = false;
    };
  }, [token, carga]);

  if (!usuario || !token) return <Redirect href="/login" />;
  if (!usuario.tcleAceito) return <Redirect href="/tcle" />;

  const voltar = () =>
    router.canGoBack() ? router.back() : router.replace('/home');

  return (
    <Tela
      titulo="Meu histórico"
      subtitulo={`Seus check-ins dos últimos ${DIAS} dias.`}
    >
      <Aviso mensagem={erro} />
      {erro ? (
        <Botao
          titulo="Tentar novamente"
          onPress={() => {
            setErro(null);
            setCarga((n) => n + 1);
          }}
        />
      ) : checkins === null ? (
        <ActivityIndicator
          color={cores.primaria}
          accessibilityLabel="Carregando o histórico"
        />
      ) : checkins.length === 0 ? (
        <View style={estilos.vazio}>
          <Text style={estilos.vazioTexto}>
            Você ainda não tem check-ins nos últimos {DIAS} dias. Que tal
            registrar como você está hoje?
          </Text>
          <Botao
            titulo="Fazer meu primeiro check-in"
            onPress={() => router.replace('/home')}
          />
        </View>
      ) : (
        <View style={estilos.lista} accessibilityRole="list">
          {checkins.map((c) => (
            <View
              key={c.id}
              style={estilos.item}
              accessibilityLabel={`Check-in de ${formatarData(c.data)}`}
            >
              <Text style={estilos.data}>{formatarData(c.data)}</Text>
              <Text style={estilos.valores}>
                Humor {c.humor}/5 · Energia {c.energia}/5 · Sono{' '}
                {formatarHoras(c.horasSono)} h
              </Text>
              {c.observacao ? (
                <Text style={estilos.observacao}>“{c.observacao}”</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
      <Botao titulo="Voltar" variante="secundario" onPress={voltar} />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  lista: { gap: espaco.sm },
  item: {
    gap: espaco.xs,
    padding: espaco.md,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
  },
  data: { fontSize: fonte.pequeno, fontWeight: '700', color: cores.textoSuave },
  valores: { fontSize: fonte.corpo, color: cores.texto },
  observacao: {
    fontSize: fonte.corpo,
    color: cores.texto,
    fontStyle: 'italic',
  },
  vazio: {
    gap: espaco.md,
    padding: espaco.lg,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
  },
  vazioTexto: { fontSize: fonte.corpo, color: cores.texto, lineHeight: 24 },
});
