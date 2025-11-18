/**
 * Fio Banka Provider
 */

import { Provider } from '@nestjs/common';
import { FioBankaService } from './fiobanka.service';

export const FioBankaProvider: Provider = {
  provide: 'FIOBANKA_PROVIDER',
  useClass: FioBankaService,
};

