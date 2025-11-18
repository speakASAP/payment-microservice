/**
 * PayPal Provider
 */

import { Provider } from '@nestjs/common';
import { PayPalService } from './paypal.service';

export const PayPalProvider: Provider = {
  provide: 'PAYPAL_PROVIDER',
  useClass: PayPalService,
};

