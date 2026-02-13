import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { TaskSchedulerService } from './task-scheduler.service';
import { UpstreamModule } from '../upstream/upstream.module';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [UpstreamModule, WalletModule, NotificationModule],
  controllers: [TaskController],
  providers: [TaskService, TaskSchedulerService],
  exports: [TaskService],
})
export class TaskModule {}
