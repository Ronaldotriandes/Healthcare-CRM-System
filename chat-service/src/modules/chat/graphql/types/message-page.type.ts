import { ObjectType, Field, Int } from '@nestjs/graphql';
import { MessageType } from './message.type';

@ObjectType('MessagePage')
export class MessagePageType {
  @Field(() => [MessageType])
  messages: MessageType[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}
