/**
 * Payments Module
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { PayPalProvider } from './providers/paypal/paypal.provider';
import { PayPalService } from './providers/paypal/paypal.service';
import { StripeProvider } from './providers/stripe/stripe.provider';
import { StripeService } from './providers/stripe/stripe.service';
import { PayUProvider } from './providers/payu/payu.provider';
import { PayUService } from './providers/payu/payu.service';
import { FioBankaProvider } from './providers/fiobanka/fiobanka.provider';
import { FioBankaService } from './providers/fiobanka/fiobanka.service';
import { ComGateProvider } from './providers/comgate/comgate.provider';
import { ComGateService } from './providers/comgate/comgate.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentTransaction]),
    HttpModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentProviderFactory,
    PayPalProvider,
    PayPalService,
    StripeProvider,
    StripeService,
    PayUProvider,
    PayUService,
    FioBankaProvider,
    FioBankaService,
    ComGateProvider,
    ComGateService,
  ],
  exports: [PaymentsService, PaymentProviderFactory],
})
export class PaymentsModule {}

