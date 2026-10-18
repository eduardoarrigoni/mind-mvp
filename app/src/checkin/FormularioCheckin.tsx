import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Checkin, DadosCheckin } from '../api/checkins';
import { Botao } from '../components/Botao';
import { CampoTexto } from '../components/CampoTexto';
import { Contador } from '../components/Contador';
import { Escala } from '../components/Escala';
import { cores, fonte } from '../tema/tema';

export const LIMITE_OBSERVACAO = 500;
/** Valor inicial do sono: o mais comum, para o check-in sair em poucos toques. */
const SONO_PADRAO = 8;

type Props = {
  /** Check-in já feito hoje (edição) ou null (novo). */
  inicial: Checkin | null;
  enviando: boolean;
  onEnviar: (dados: DadosCheckin) => void;
};

/** UC04 – check-in rápido: dois toques nas escalas e "Registrar". */
export function FormularioCheckin({ inicial, enviando, onEnviar }: Props) {
  const [humor, setHumor] = useState<number | null>(inicial?.humor ?? null);
  const [energia, setEnergia] = useState<number | null>(
    inicial?.energia ?? null,
  );
  const [horasSono, setHorasSono] = useState(inicial?.horasSono ?? SONO_PADRAO);
  const [observacao, setObservacao] = useState(inicial?.observacao ?? '');

  const completo = humor !== null && energia !== null;

  return (
    <View style={estilos.formulario}>
      <Escala
        rotulo="Humor"
        valor={humor}
        onAlterar={setHumor}
        extremos={['Muito mal', 'Muito bem']}
      />
      <Escala
        rotulo="Energia"
        valor={energia}
        onAlterar={setEnergia}
        extremos={['Sem energia', 'Muita energia']}
      />
      <Contador
        rotulo="Horas de sono"
        valor={horasSono}
        onAlterar={setHorasSono}
        minimo={0}
        maximo={24}
        passo={0.5}
        unidade="h"
      />
      <CampoTexto
        rotulo="Observação (opcional)"
        value={observacao}
        onChangeText={setObservacao}
        maxLength={LIMITE_OBSERVACAO}
        multiline
        placeholder="Algo que queira registrar sobre hoje?"
      />
      <Text style={estilos.contagem}>
        {observacao.length}/{LIMITE_OBSERVACAO}
      </Text>
      <Botao
        titulo={inicial ? 'Atualizar check-in' : 'Registrar check-in'}
        desabilitado={!completo}
        carregando={enviando}
        onPress={() =>
          completo &&
          onEnviar({
            humor,
            energia,
            horasSono,
            observacao: observacao.trim() || null,
          })
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { gap: 16 },
  contagem: {
    alignSelf: 'flex-end',
    marginTop: -12,
    fontSize: fonte.pequeno,
    color: cores.textoSuave,
  },
});
