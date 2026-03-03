import { Resolver, Query, Mutation, Args, Context, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ChatService } from '../chat.service';
import { AuthGuard } from '../guards/auth.guard';
import { ChatRoomType } from './types/chat-room.type';
import { MessagePageType } from './types/message-page.type';
import { QueueResultType } from './types/queue-result.type';
import { CreateChatRoomInput } from './inputs/create-chat-room.input';
import { SendMessageInput } from './inputs/send-message.input';
import { GetMessagesInput } from './inputs/get-messages.input';

/**
 * Chat GraphQL Resolver
 *
 * Semua mutation write (sendMessage) TIDAK langsung ke DB.
 * Sama seperti REST controller — publish ke queue dulu.
 * Context.req.user diset oleh AuthGuard setelah validasi ke auth-service.
 */
@Resolver(() => ChatRoomType)
@UseGuards(AuthGuard)
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  // ─── Queries ───────────────────────────────────────────────────────────────

  @Query(() => [ChatRoomType], { description: 'List semua chat room user' })
  async chatRooms(@Context() ctx: { req: any }): Promise<ChatRoomType[]> {
    const userId: string = ctx.req.user.id;
    return this.chatService.getChatRooms(userId) as any;
  }

  @Query(() => ChatRoomType, { description: 'Detail satu chat room' })
  async chatRoom(
    @Args('roomId', { type: () => ID }) roomId: string,
    @Context() ctx: { req: any },
  ): Promise<ChatRoomType> {
    const userId: string = ctx.req.user.id;
    return this.chatService.getChatRoomById(roomId, userId) as any;
  }

  @Query(() => MessagePageType, { description: 'Messages dalam room (paginated)' })
  async messages(@Args('input') input: GetMessagesInput): Promise<MessagePageType> {
    const result = await this.chatService.getMessages(input);
    return {
      messages: result.messages as any,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  // ─── Mutations ─────────────────────────────────────────────────────────────

  @Mutation(() => ChatRoomType, { description: 'Buat chat room baru' })
  async createChatRoom(
    @Args('input') input: CreateChatRoomInput,
    @Context() ctx: { req: any },
  ): Promise<ChatRoomType> {
    const userId: string = ctx.req.user.id;
    return this.chatService.createChatRoom(input, userId) as any;
  }

  /**
   * sendMessage — publish ke queue, TIDAK langsung insert ke DB
   * Mengembalikan jobId (bukan message object) karena message belum ada di DB saat ini.
   */
  @Mutation(() => QueueResultType, {
    description: 'Kirim pesan (async via queue, bukan langsung ke DB)',
  })
  async sendMessage(
    @Args('input') input: SendMessageInput,
    @Context() ctx: { req: any },
  ): Promise<QueueResultType> {
    const userId: string = ctx.req.user.id;
    return this.chatService.sendMessage(input, userId);
  }

  @Query(() => Boolean, { description: 'Cek apakah user sedang online' })
  async isUserOnline(
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return this.chatService.isUserOnline(userId);
  }
}
