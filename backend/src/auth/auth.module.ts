import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AplAutenticacao } from './apl-autenticacao.service.js';
import { AuthController } from './auth.controller.js';

@Module({
  imports: [UsuariosModule],
  controllers: [AuthController],
  providers: [AplAutenticacao],
})
export class AuthModule {}
