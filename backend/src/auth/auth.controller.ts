import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AplAutenticacao, UsuarioPublico } from './apl-autenticacao.service.js';
import { CadastroPacienteDto } from './dto/cadastro-paciente.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly aplAutenticacao: AplAutenticacao) {}

  /** UC01 – cadastro de paciente. */
  @Post('cadastro')
  @HttpCode(HttpStatus.CREATED)
  cadastrar(@Body() dados: CadastroPacienteDto): Promise<UsuarioPublico> {
    return this.aplAutenticacao.cadastrarPaciente(dados);
  }
}
