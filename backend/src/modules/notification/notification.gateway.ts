import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false)
      : '*',
  },
  namespace: '/ws',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationGateway.name);
  private userSockets: Map<number, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.sub;
      client.data.userId = userId;

      // 记录用户连接
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      const sockets = this.userSockets.get(userId);
      if (!sockets) {
        client.disconnect();
        return;
      }
      sockets.add(client.id);

      client.join(`user:${userId}`);
      this.logger.log(`User ${userId} connected (${client.id})`);
    } catch (error) {
      this.logger.warn(`WebSocket auth failed: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId);
      if (!sockets) {
        return;
      }

      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * 推送新邮件通知
   */
  notifyNewMail(userId: number, data: { taskId: number; email: string; code?: string; subject?: string }) {
    this.server.to(`user:${userId}`).emit('newMail', data);
  }

  /**
   * 推送任务状态变更
   */
  notifyTaskUpdate(userId: number, data: { taskId: number; status: string; email: string }) {
    this.server.to(`user:${userId}`).emit('taskUpdate', data);
  }

  /**
   * 推送系统通知
   */
  notifySystem(userId: number, message: string) {
    this.server.to(`user:${userId}`).emit('systemNotify', { message });
  }

  /**
   * 广播公告
   */
  broadcastAnnouncement(data: { title: string; content: string }) {
    this.server.emit('announcement', data);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    return { event: 'pong', data: { time: Date.now() } };
  }
}
