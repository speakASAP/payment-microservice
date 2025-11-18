/**
 * Stripe Provider
 */

import { Provider } from '@nestjs/common';
import { StripeService } from './stripe.service';

export const StripeProvider: Provider = {
  provide: 'STRIPE_PROVIDER',
  useClass: StripeService,
};

