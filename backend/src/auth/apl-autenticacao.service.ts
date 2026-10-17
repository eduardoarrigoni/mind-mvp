import { ConflictException, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { UsuarioDAO } from '../usuarios/usuario.dao.js';
import { Paciente, Papel, Usuario } from '../usuarios/usuario.entity.js';
import { CadastroPacienteDto } from './dto/cadastro-paciente.dto.js';

/** Custo do bcrypt exigido pelo critério de qualidade CQ01 (≥ 12). */
export const CUSTO_BCRYPT = 12;

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
  constructor(private readonly usuarios: UsuarioDAO) {}

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
