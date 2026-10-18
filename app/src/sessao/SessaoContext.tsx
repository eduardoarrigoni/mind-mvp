import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiAuth, DadosCadastro, Usuario } from '../api/auth';
import { ErroApi } from '../api/cliente';
import { apagarToken, lerToken, salvarToken } from './armazenamento';

type ValorSessao = {
  /** true enquanto restaura a sessão salva ao abrir o app. */
  carregando: boolean;
  token: string | null;
  usuario: Usuario | null;
  entrar(email: string, senha: string): Promise<Usuario>;
  cadastrar(dados: DadosCadastro): Promise<Usuario>;
  sair(): Promise<void>;
  /** Recarrega o perfil (ex.: depois do aceite do TCLE). */
  atualizarPerfil(): Promise<Usuario | null>;
};

const Contexto = createContext<ValorSessao | null>(null);

/** Para onde ir depois de entrar: TCLE pendente → termo; senão → Home. */
export const rotaAposEntrar = (usuario: Usuario) =>
  usuario.tcleAceito ? '/home' : '/tcle';

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const limpar = useCallback(async () => {
    await apagarToken();
    setToken(null);
    setUsuario(null);
  }, []);

  // Restaura a sessão salva; token expirado/inválido é descartado.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const salvo = await lerToken();
        if (!salvo) return;
        const perfil = await apiAuth.perfil(salvo);
        if (ativo) {
          setToken(salvo);
          setUsuario(perfil);
        }
      } catch (erro) {
        if (erro instanceof ErroApi && erro.status === 401) await limpar();
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [limpar]);

  const entrar = useCallback(async (email: string, senha: string) => {
    const sessao = await apiAuth.entrar(email.trim(), senha);
    await salvarToken(sessao.accessToken);
    setToken(sessao.accessToken);
    setUsuario(sessao.usuario);
    return sessao.usuario;
  }, []);

  const cadastrar = useCallback(
    async (dados: DadosCadastro) => {
      await apiAuth.cadastrar(dados);
      return entrar(dados.email, dados.senha);
    },
    [entrar],
  );

  const atualizarPerfil = useCallback(async () => {
    if (!token) return null;
    const perfil = await apiAuth.perfil(token);
    setUsuario(perfil);
    return perfil;
  }, [token]);

  const valor = useMemo(
    () => ({
      carregando,
      token,
      usuario,
      entrar,
      cadastrar,
      sair: limpar,
      atualizarPerfil,
    }),
    [carregando, token, usuario, entrar, cadastrar, limpar, atualizarPerfil],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ValorSessao {
  const valor = useContext(Contexto);
  if (!valor)
    throw new Error('useSessao deve ser usado dentro de SessaoProvider');
  return valor;
}
