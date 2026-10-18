import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AplCheckin } from './apl-checkin.service.js';
import { CheckinDAO } from './checkin.dao.js';
import { Checkin } from './checkin.entity.js';
import { CheckinsController } from './checkins.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Checkin])],
  controllers: [CheckinsController],
  providers: [AplCheckin, CheckinDAO],
})
export class CheckinsModule {}
