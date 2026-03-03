import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateChatRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  participantIds: string[];
}
