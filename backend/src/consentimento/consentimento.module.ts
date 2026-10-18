import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AplConsentimento } from './apl-consentimento.service.js';
import { ConsentimentoController } from './consentimento.controller.js';
import { AceiteTcleDAO, TermoConsentimentoDAO } from './consentimento.dao.js';
import { AceiteTcle, TermoConsentimento } from './consentimento.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([TermoConsentimento, AceiteTcle])],
  controllers: [ConsentimentoController],
  providers: [AplConsentimento, TermoConsentimentoDAO, AceiteTcleDAO],
  exports: [AplConsentimento],
})
export class ConsentimentoModule {}
