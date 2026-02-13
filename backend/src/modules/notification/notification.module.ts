import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationGateway } from './notification.gateway';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [NotificationGateway],
  exports: [NotificationGateway],
})
export class NotificationModule {}
