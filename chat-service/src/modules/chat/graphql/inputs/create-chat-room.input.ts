import { InputType, Field } from '@nestjs/graphql';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class CreateChatRoomInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => [String])
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  participantIds: string[];
}
