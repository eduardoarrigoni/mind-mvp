import { router } from 'expo-router';
import { useState } from 'react';
import { ErroApi } from '../api/cliente';
import { Aviso } from '../components/Aviso';
import { Botao } from '../components/Botao';
import { CampoTexto } from '../components/CampoTexto';
import { Tela } from '../components/Tela';
import { rotaAposEntrar, useSessao } from '../sessao/SessaoContext';
import {
  CamposCadastro,
  dataParaIso,
  mascararData,
  temErros,
  validarCadastro,
} from '../sessao/validacao';

const VAZIO: CamposCadastro = {
  nome: '',
  email: '',
  dataNascimento: '',
  senha: '',
  confirmacao: '',
};

/** UC01 – cadastro do paciente; ao concluir, já entra e segue para o TCLE. */
export default function Cadastro() {
  const { cadastrar } = useSessao();
  const [campos, setCampos] = useState(VAZIO);
  const [erros, setErros] = useState<ReturnType<typeof validarCadastro>>({});
  const [erroApi, setErroApi] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const alterar = (campo: keyof CamposCadastro) => (valor: string) =>
    setCampos((atual) => ({ ...atual, [campo]: valor }));

  async function enviar() {
    const encontrados = validarCadastro(campos);
    setErros(encontrados);
    setErroApi(null);
    if (temErros(encontrados)) return;

    setEnviando(true);
    try {
      const usuario = await cadastrar({
        nome: campos.nome.trim(),
        email: campos.email.trim(),
        dataNascimento: dataParaIso(campos.dataNascimento)!,
        senha: campos.senha,
      });
      router.replace(rotaAposEntrar(usuario));
    } catch (erro) {
      setErroApi(
        erro instanceof ErroApi
          ? erro.message
          : 'Não foi possível concluir o cadastro.',
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela
      titulo="Criar conta"
      subtitulo="Seus dados ficam protegidos e só você decide quem os vê."
    >
      <Aviso mensagem={erroApi} />
      <CampoTexto
        rotulo="Nome"
        value={campos.nome}
        onChangeText={alterar('nome')}
        erro={erros.nome}
        autoCapitalize="words"
        autoComplete="name"
      />
      <CampoTexto
        rotulo="E-mail"
        value={campos.email}
        onChangeText={alterar('email')}
        erro={erros.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <CampoTexto
        rotulo="Data de nascimento"
        value={campos.dataNascimento}
        onChangeText={(v) => alterar('dataNascimento')(mascararData(v))}
        erro={erros.dataNascimento}
        placeholder="DD/MM/AAAA"
        keyboardType="number-pad"
        maxLength={10}
      />
      <CampoTexto
        rotulo="Senha"
        value={campos.senha}
        onChangeText={alterar('senha')}
        erro={erros.senha}
        secureTextEntry
        placeholder="Mínimo de 8 caracteres"
        autoComplete="new-password"
      />
      <CampoTexto
        rotulo="Confirme a senha"
        value={campos.confirmacao}
        onChangeText={alterar('confirmacao')}
        erro={erros.confirmacao}
        secureTextEntry
        autoComplete="new-password"
        onSubmitEditing={enviar}
      />
      <Botao titulo="Cadastrar" onPress={enviar} carregando={enviando} />
      <Botao
        titulo="Já tenho conta"
        variante="secundario"
        onPress={() => router.replace('/login')}
      />
    </Tela>
  );
}
