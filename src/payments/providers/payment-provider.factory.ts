/**
 * Payment Provider Factory
 */

import { Injectable, Inject } from '@nestjs/common';
import { PaymentMethod } from '../entities/payment.entity';
import { PaymentProvider } from './payment-provider.interface';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    @Inject('PAYPAL_PROVIDER') private paypalProvider: PaymentProvider,
    @Inject('STRIPE_PROVIDER') private stripeProvider: PaymentProvider,
    @Inject('PAYU_PROVIDER') private payuProvider: PaymentProvider,
    @Inject('FIOBANKA_PROVIDER') private fiobankaProvider: PaymentProvider,
    @Inject('COMGATE_PROVIDER') private comgateProvider: PaymentProvider,
  ) {}

  getProvider(paymentMethod: PaymentMethod): PaymentProvider {
    switch (paymentMethod) {
      case PaymentMethod.PAYPAL:
        return this.paypalProvider;
      case PaymentMethod.STRIPE:
      case PaymentMethod.CARD:
        return this.stripeProvider;
      case PaymentMethod.PAYU:
        return this.payuProvider;
      case PaymentMethod.FIOBANKA:
        return this.fiobankaProvider;
      case PaymentMethod.COMGATE:
        return this.comgateProvider;
      default:
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }
  }
}

