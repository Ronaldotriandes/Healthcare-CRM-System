import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'libs/prisma/src';
import {
  QUEUE_NAMES,
  JOB_NAMES,
  MessageJobData,
} from './interfaces/queue.interface';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { ChatRoomResponseDto, MessageResponseDto } from './dto/chat-response.dto';


@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.MESSAGE) private messageQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}


  async createChatRoom(
    dto: CreateChatRoomDto,
    userId: string,
  ): Promise<ChatRoomResponseDto> {
    const allParticipantIds = [...new Set([...dto.participantIds, userId])];

    const chatRoom = await this.prisma.chatRoom.create({
      data: {
        name: dto.name,
        participants: {
          create: allParticipantIds.map((uid) => ({ userId: uid })),
        },
      },
      include: {
        participants: true,
      },
    });

    await this.cacheManager.del(`chat:rooms:${userId}`);

    return chatRoom;
  }

  async getChatRooms(userId: string): Promise<ChatRoomResponseDto[]> {
    const cacheKey = `chat:rooms:${userId}`;

    const cached = await this.cacheManager.get<ChatRoomResponseDto[]>(cacheKey);
    if (cached) return cached;

    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: true,
        messages: {
          take: 1,
          orderBy: { sequenceNumber: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const result: ChatRoomResponseDto[] = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      participants: room.participants.map((p) => ({
        userId: p.userId,
        joinedAt: p.joinedAt,
      })),
      lastMessage: room.messages[0] ?? undefined,
    }));

    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }

  async getChatRoomById(
    roomId: string,
    userId: string,
  ): Promise<ChatRoomResponseDto> {
    const room = await this.prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        participants: { some: { userId } },
      },
      include: { participants: true },
    });

    if (!room) throw new NotFoundException('Chat room not found');

    return {
      id: room.id,
      name: room.name,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      participants: room.participants.map((p) => ({
        userId: p.userId,
        joinedAt: p.joinedAt,
      })),
    };
  }


  async sendMessage(
    dto: SendMessageDto,
    userId: string,
    file?: Express.Multer.File,
  ): Promise<{ jobId: string; message: string }> {
    await this.getChatRoomById(dto.roomId, userId);

    const idempotencyKey = dto.idempotencyKey || uuidv4();

    const existing = await this.prisma.message.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return { jobId: 'duplicate', message: 'Message already sent' };
    }

    const jobData: MessageJobData = {
      roomId: dto.roomId,
      senderId: userId,
      content: dto.content,
      idempotencyKey,
      timestamp: Date.now(),
    };

    if (file) {
      jobData.attachmentUrl = `/uploads/${file.filename}`;
      jobData.attachmentType = this.getAttachmentType(file.mimetype);
      jobData.attachmentName = file.originalname;
    }

    const job = await this.messageQueue.add(JOB_NAMES.SEND_MESSAGE, jobData, {
      priority: -jobData.timestamp,
      jobId: idempotencyKey, 
    });

    await this.cacheManager.del(`chat:rooms:${userId}`);
    await this.cacheManager.del(`chat:messages:${dto.roomId}`);

    return { jobId: job.id.toString(), message: 'Message queued for delivery' };
  }

  async getMessages(dto: GetMessagesDto): Promise<{
    messages: MessageResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const skip = (page - 1) * limit;
    const cacheKey = `chat:messages:${dto.roomId}:${page}:${limit}`;

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached as any;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { roomId: dto.roomId },
        orderBy: { sequenceNumber: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { roomId: dto.roomId } }),
    ]);

    const result = { messages, total, page, limit };
    await this.cacheManager.set(cacheKey, result, 120);
    return result;
  }


  async setUserOnline(userId: string): Promise<void> {
    await this.cacheManager.set(`user:online:${userId}`, true, 300);
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.cacheManager.del(`user:online:${userId}`);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return !!(await this.cacheManager.get(`user:online:${userId}`));
  }

  async getParticipantIds(roomId: string): Promise<string[]> {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: { participants: { select: { userId: true } } },
    });
    return room?.participants.map((p) => p.userId) ?? [];
  }


  private getAttachmentType(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'file';
  }
}
