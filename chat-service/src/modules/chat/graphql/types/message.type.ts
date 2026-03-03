import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType('Message')
export class MessageType {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field(() => ID)
  roomId: string;

  @Field()
  senderId: string;

  @Field({ nullable: true })
  attachmentUrl?: string;

  @Field({ nullable: true })
  attachmentType?: string;

  @Field({ nullable: true })
  attachmentName?: string;

  @Field()
  createdAt: Date;
}
