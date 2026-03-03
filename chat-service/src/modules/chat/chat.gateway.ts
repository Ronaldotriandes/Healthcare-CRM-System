import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';


@WebSocketGateway({
  cors: { origin: '*', credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets = new Map<string, string[]>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers.authorization as string)?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId: string = payload.sub;
      client.data.userId = userId;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(client.id);

      await this.chatService.setUserOnline(userId);
      client.broadcast.emit('user:online', { userId });

      this.logger.log(`User ${userId} connected [socket: ${client.id}]`);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const userId: string = client.data.userId;
    if (!userId) return;

    const sockets = this.userSockets.get(userId) ?? [];
    const updated = sockets.filter((id) => id !== client.id);

    if (updated.length === 0) {
      this.userSockets.delete(userId);
      await this.chatService.setUserOffline(userId);
      client.broadcast.emit('user:offline', { userId });
    } else {
      this.userSockets.set(userId, updated);
    }

    this.logger.log(`User ${userId} disconnected [socket: ${client.id}]`);
  }

  @SubscribeMessage('room:join')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): Promise<void> {
    const userId: string = client.data.userId;
    try {
      await this.chatService.getChatRoomById(data.roomId, userId);
      client.join(data.roomId);
      client
        .to(data.roomId)
        .emit('room:user_joined', { roomId: data.roomId, userId });
    } catch {
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): void {
    const userId: string = client.data.userId;
    client.leave(data.roomId);
    client
      .to(data.roomId)
      .emit('room:user_left', { roomId: data.roomId, userId });
  }

  @SubscribeMessage('message:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; isTyping: boolean },
  ): void {
    client.to(data.roomId).emit('message:typing', {
      roomId: data.roomId,
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('message:read')
  handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; messageId: string },
  ): void {
    client.to(data.roomId).emit('message:read', {
      roomId: data.roomId,
      messageId: data.messageId,
      userId: client.data.userId,
      readAt: new Date().toISOString(),
    });
  }


  emitNewMessage(roomId: string, message: unknown): void {
    this.server.to(roomId).emit('message:new', message);
  }

  emitNotification(userId: string, notification: unknown): void {
    const sockets = this.userSockets.get(userId) ?? [];
    for (const socketId of sockets) {
      this.server.to(socketId).emit('notification', notification);
    }
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
