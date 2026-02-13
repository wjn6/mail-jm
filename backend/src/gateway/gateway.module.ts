import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeyModule } from '../modules/api-key/api-key.module';
import { TaskModule } from '../modules/task/task.module';
import { WalletModule } from '../modules/wallet/wallet.module';

@Module({
  imports: [ApiKeyModule, TaskModule, WalletModule],
  controllers: [GatewayController],
  providers: [ApiKeyGuard],
})
export class GatewayApiModule {}
