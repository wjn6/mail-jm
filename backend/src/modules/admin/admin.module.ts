import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { WalletModule } from '../wallet/wallet.module';
import { UpstreamModule } from '../upstream/upstream.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [WalletModule, UpstreamModule, NotificationModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
