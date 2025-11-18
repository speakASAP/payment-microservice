/**
 * PayU Provider
 */

import { Provider } from '@nestjs/common';
import { PayUService } from './payu.service';

export const PayUProvider: Provider = {
  provide: 'PAYU_PROVIDER',
  useClass: PayUService,
};

