export interface MessageJobData {
  roomId: string;
  senderId: string; 
  content: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  idempotencyKey: string;
  timestamp: number; 
}

export interface NotificationJobData {
  roomId: string;
  messageId: string;
  senderId: string;
  recipientIds: string[];
}

export const QUEUE_NAMES = {
  MESSAGE: 'chat:message-queue',
  NOTIFICATION: 'chat:notification-queue',
  DLQ: 'chat:dead-letter-queue',
} as const;

export const JOB_NAMES = {
  SEND_MESSAGE: 'send-message',
  SEND_NOTIFICATION: 'send-notification',
  PROCESS_DLQ: 'process-dlq',
} as const;
