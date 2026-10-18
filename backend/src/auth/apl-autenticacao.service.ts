import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AplConsentimento } from '../consentimento/apl-consentimento.service.js';
import { UsuarioDAO } from '../usuarios/usuario.dao.js';
import { Paciente, Papel, Usuario } from '../usuarios/usuario.entity.js';
import { CadastroPacienteDto } from './dto/cadastro-paciente.dto.js';
import { LoginDto } from './dto/login.dto.js';

/** Custo do bcrypt exigido pelo critério de qualidade CQ01 (≥ 12). */
export const CUSTO_BCRYPT = 12;

/** Mensagem única: não revela se o erro está no e-mail ou na senha. */
export const MENSAGEM_LOGIN_INVALIDO = 'E-mail ou senha inválidos.';

/**
 * Hash bcrypt (custo 12) de uma senha qualquer, comparado quando o e-mail não
 * existe para que a resposta leve o mesmo tempo nos dois casos.
 */
const HASH_FICTICIO =
  '$2b$12$niUJ9nfO20kx.Xmg36ES9OlAXJGb8bkzlY2Jp0jtyGBOPemoweDrm';

export interface Sessao {
  accessToken: string;
  usuario: PerfilUsuario;
}

/** Usuário público + situação do TCLE (o app decide se mostra o termo ou a Home). */
export interface PerfilUsuario extends UsuarioPublico {
  tcleAceito: boolean;
}

export interface UsuarioPublico {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  dataNascimento?: string | null;
  criadoEm: Date;
}

/** AplAutenticacao – casos de uso de acesso e identidade (UC01, UC13). */
@Injectable()
export class AplAutenticacao {
  constructor(
    private readonly usuarios: UsuarioDAO,
    private readonly jwt: JwtService,
    private readonly consentimento: AplConsentimento,
  ) {}

  /** UC01 – cadastro de paciente. */
  async cadastrarPaciente(dados: CadastroPacienteDto): Promise<UsuarioPublico> {
    const email = dados.email.trim().toLowerCase();
    if (await this.usuarios.buscarPorEmail(email)) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }

    const paciente = Object.assign(new Paciente(), {
      nome: dados.nome.trim(),
      email,
      dataNascimento: dados.dataNascimento,
      senhaHash: await bcrypt.hash(dados.senha, CUSTO_BCRYPT),
    });

    try {
      return this.paraPublico(await this.usuarios.salvar(paciente));
    } catch (erro) {
      // Corrida entre dois cadastros simultâneos: a restrição única do banco decide.
      if ((erro as { code?: string }).code === '23505') {
        throw new ConflictException('Já existe uma conta com este e-mail.');
      }
      throw erro;
    }
  }

  /** UC01 – login: devolve um JWT com o id e o PAPEL do usuário. */
  async entrar(dados: LoginDto): Promise<Sessao> {
    const usuario = await this.usuarios.buscarPorEmail(dados.email, true);
    const senhaConfere = await bcrypt.compare(
      dados.senha,
      usuario?.senhaHash ?? HASH_FICTICIO,
    );
    if (!usuario || !senhaConfere) {
      throw new UnauthorizedException(MENSAGEM_LOGIN_INVALIDO);
    }

    const accessToken = await this.jwt.signAsync({
      sub: usuario.id,
      papel: usuario.papel,
    });
    return { accessToken, usuario: await this.paraPerfil(usuario) };
  }

  /** Dados do usuário autenticado (rota protegida GET /auth/me). */
  async buscarPerfil(id: string): Promise<PerfilUsuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) throw new UnauthorizedException('Sessão inválida.');
    return this.paraPerfil(usuario);
  }

  private async paraPerfil(usuario: Usuario): Promise<PerfilUsuario> {
    return {
      ...this.paraPublico(usuario),
      tcleAceito: await this.consentimento.aceitouVigente(usuario.id),
    };
  }

  /** Nunca expõe o hash da senha. */
  paraPublico(u: Usuario & Partial<Paciente>): UsuarioPublico {
    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      papel: u.papel as Papel,
      dataNascimento: u.dataNascimento,
      criadoEm: u.criadoEm,
    };
  }
}
