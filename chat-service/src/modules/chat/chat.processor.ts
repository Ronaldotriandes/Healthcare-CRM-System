import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { PrismaService } from 'libs/prisma/src';
import {
  QUEUE_NAMES,
  JOB_NAMES,
  MessageJobData,
  NotificationJobData,
} from './interfaces/queue.interface';
import { ChatGateway } from './chat.gateway';


@Processor(QUEUE_NAMES.MESSAGE)
export class MessageProcessor {
  private readonly logger = new Logger(MessageProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private notificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.DLQ) private dlqQueue: Queue,
  ) {}

  @Process(JOB_NAMES.SEND_MESSAGE)
  async handleSendMessage(job: Job<MessageJobData>): Promise<void> {
    const { data } = job;
    this.logger.debug(`Processing message job ${job.id} [room: ${data.roomId}]`);

    try {
      const existing = await this.prisma.message.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
      });
      if (existing) {
        this.logger.warn(
          `Duplicate message [idempotencyKey: ${data.idempotencyKey}] — skipped`,
        );
        return;
      }

      const message = await this.prisma.$transaction(async (tx) => {
        const msg = await tx.message.create({
          data: {
            content: data.content,
            roomId: data.roomId,
            senderId: data.senderId,
            attachmentUrl: data.attachmentUrl,
            attachmentType: data.attachmentType,
            attachmentName: data.attachmentName,
            idempotencyKey: data.idempotencyKey,
          },
        });

        await tx.chatRoom.update({
          where: { id: data.roomId },
          data: { updatedAt: new Date() },
        });

        return msg;
      });

      this.logger.log(`Message ${message.id} saved [room: ${data.roomId}]`);

      this.chatGateway.emitNewMessage(data.roomId, message);

      const recipientIds = await this.prisma.chatRoomParticipant
        .findMany({
          where: { roomId: data.roomId, NOT: { userId: data.senderId } },
          select: { userId: true },
        })
        .then((list) => list.map((p) => p.userId));

      if (recipientIds.length > 0) {
        await this.notificationQueue.add(JOB_NAMES.SEND_NOTIFICATION, {
          roomId: data.roomId,
          messageId: message.id,
          senderId: data.senderId,
          recipientIds,
        } satisfies NotificationJobData);
      }
    } catch (error) {
      this.logger.error(
        `Failed to process message job ${job.id}: ${error.message}`,
        error.stack,
      );
      throw error; 
    }
  }

  @OnQueueFailed()
  async handleFailedJob(job: Job, error: Error): Promise<void> {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
    );

    if (job.attemptsMade >= 3) {
      await this.dlqQueue.add(
        JOB_NAMES.PROCESS_DLQ,
        {
          originalQueue: QUEUE_NAMES.MESSAGE,
          originalJobId: job.id,
          originalData: job.data,
          error: error.message,
          failedAt: new Date().toISOString(),
          attempts: job.attemptsMade,
        },
        { removeOnComplete: false, removeOnFail: false },
      );
      this.logger.warn(`Job ${job.id} moved to Dead Letter Queue`);
    }
  }
}


@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly chatGateway: ChatGateway,
    @InjectQueue(QUEUE_NAMES.DLQ) private dlqQueue: Queue,
  ) {}

  @Process(JOB_NAMES.SEND_NOTIFICATION)
  async handleNotification(job: Job<NotificationJobData>): Promise<void> {
    const { data } = job;
    try {
      for (const recipientId of data.recipientIds) {
        this.chatGateway.emitNotification(recipientId, {
          type: 'new_message',
          roomId: data.roomId,
          messageId: data.messageId,
          senderId: data.senderId,
          timestamp: new Date().toISOString(),
        });
      }
      this.logger.log(
        `Notifications sent to ${data.recipientIds.length} recipients`,
      );
    } catch (error) {
      this.logger.error(`Notification job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  @OnQueueFailed()
  async handleFailedJob(job: Job, error: Error): Promise<void> {
    if (job.attemptsMade >= 3) {
      await this.dlqQueue.add(JOB_NAMES.PROCESS_DLQ, {
        originalQueue: QUEUE_NAMES.NOTIFICATION,
        originalJobId: job.id,
        originalData: job.data,
        error: error.message,
        failedAt: new Date().toISOString(),
        attempts: job.attemptsMade,
      });
    }
  }
}


@Processor(QUEUE_NAMES.DLQ)
export class DLQProcessor {
  private readonly logger = new Logger(DLQProcessor.name);

  @Process(JOB_NAMES.PROCESS_DLQ)
  async handleDLQ(job: Job): Promise<void> {
    this.logger.error(
      `[DLQ] Job ${job.id} — originalQueue: ${job.data.originalQueue}`,
      JSON.stringify(job.data, null, 2),
    );
    // TODO: simpan ke tabel dlq_messages untuk audit trail
  }
}
