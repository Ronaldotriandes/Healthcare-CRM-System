export class MessageResponseDto {
  id: string;
  content: string;
  roomId: string;
  senderId: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
  sequenceNumber: bigint;
  createdAt: Date;
}

export class ParticipantDto {
  userId: string;
  joinedAt: Date;
}

export class ChatRoomResponseDto {
  id: string;
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants?: ParticipantDto[];
  lastMessage?: MessageResponseDto;
}
