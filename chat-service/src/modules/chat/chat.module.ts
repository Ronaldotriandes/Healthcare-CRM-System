import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'libs/prisma/src';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import {
  MessageProcessor,
  NotificationProcessor,
  DLQProcessor,
} from './chat.processor';
import { AuthGuard } from './guards/auth.guard';
import { ChatResolver } from './graphql/chat.resolver';
import { QUEUE_NAMES } from './interfaces/queue.interface';
import { queueConfig } from '../../config/queue.config';


@Module({
  imports: [
    PrismaModule,

    HttpModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    }),

    BullModule.registerQueue(
      { name: QUEUE_NAMES.MESSAGE, ...queueConfig },
      { name: QUEUE_NAMES.NOTIFICATION, ...queueConfig },
      {
        name: QUEUE_NAMES.DLQ,
        ...queueConfig,
        defaultJobOptions: {
          removeOnComplete: false, 
          removeOnFail: false,
          attempts: 1, 
        },
      },
    ),
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    ChatResolver,
    AuthGuard,
    MessageProcessor,
    NotificationProcessor,
    DLQProcessor,
  ],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
