/**
 * ComGate Provider
 */

import { Provider } from '@nestjs/common';
import { ComGateService } from './comgate.service';

export const ComGateProvider: Provider = {
  provide: 'COMGATE_PROVIDER',
  useClass: ComGateService,
};

