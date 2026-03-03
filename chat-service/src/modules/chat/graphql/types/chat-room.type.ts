import { ObjectType, Field, ID } from '@nestjs/graphql';
import { MessageType } from './message.type';

@ObjectType('Participant')
export class ParticipantType {
  @Field()
  userId: string;

  @Field()
  joinedAt: Date;
}

@ObjectType('ChatRoom')
export class ChatRoomType {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => [ParticipantType])
  participants: ParticipantType[];

  @Field({ nullable: true })
  lastMessage?: MessageType;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
