import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AplAutenticacao } from './apl-autenticacao.service.js';
import { AuthController } from './auth.controller.js';
import { AutenticacaoGuard, PapeisGuard } from './guards.js';
import { opcoesJwt } from './jwt.config.js';

@Module({
  imports: [
    UsuariosModule,
    JwtModule.registerAsync({ useFactory: () => opcoesJwt() }),
  ],
  controllers: [AuthController],
  providers: [
    AplAutenticacao,
    // Guards globais, nesta ordem: todas as rotas exigem token (salvo @Publico())
    // e as marcadas com @Papeis(...) exigem o PAPEL correspondente.
    { provide: APP_GUARD, useClass: AutenticacaoGuard },
    { provide: APP_GUARD, useClass: PapeisGuard },
  ],
})
export class AuthModule {}
