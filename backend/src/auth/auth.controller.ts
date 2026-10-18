import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  AplAutenticacao,
  PerfilUsuario,
  Sessao,
  UsuarioPublico,
} from './apl-autenticacao.service.js';
import { Publico, UsuarioAtual } from './decoradores.js';
import type { UsuarioAutenticado } from './decoradores.js';
import { CadastroPacienteDto } from './dto/cadastro-paciente.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly aplAutenticacao: AplAutenticacao) {}

  /** UC01 – cadastro de paciente. */
  @Publico()
  @Post('cadastro')
  @HttpCode(HttpStatus.CREATED)
  cadastrar(@Body() dados: CadastroPacienteDto): Promise<UsuarioPublico> {
    return this.aplAutenticacao.cadastrarPaciente(dados);
  }

  /** UC01 – login com e-mail e senha. */
  @Publico()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  entrar(@Body() dados: LoginDto): Promise<Sessao> {
    return this.aplAutenticacao.entrar(dados);
  }

  /** Perfil do usuário autenticado e situação do TCLE (exige token). */
  @Get('me')
  perfil(@UsuarioAtual() usuario: UsuarioAutenticado): Promise<PerfilUsuario> {
    return this.aplAutenticacao.buscarPerfil(usuario.id);
  }
}
