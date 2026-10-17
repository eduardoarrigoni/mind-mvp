import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioDAO } from './usuario.dao.js';
import { Paciente, Profissional, Usuario } from './usuario.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Paciente, Profissional])],
  providers: [UsuarioDAO],
  exports: [UsuarioDAO],
})
export class UsuariosModule {}
