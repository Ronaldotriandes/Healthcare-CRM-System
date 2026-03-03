import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class SendMessageInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  roomId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  content: string;

  @Field({ nullable: true, description: 'Untuk mencegah duplicate message (idempotency)' })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
