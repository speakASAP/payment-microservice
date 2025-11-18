/**
 * Webhooks Module
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PaymentsModule } from '../payments/payments.module';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [
    PaymentsModule,
    TypeOrmModule.forFeature([Payment]),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule {}

