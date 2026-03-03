import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Request,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ChatService } from './chat.service';
import { AuthGuard } from './guards/auth.guard';
import { CreateChatRoomDto } from './dto/create-chat-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import {
  ApiResponse,
  GetResponseDto,
  CreatedResponseDto,
} from '../../utils/dto/response.dto';


@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}


  @Post('rooms')
  async createChatRoom(
    @Body() dto: CreateChatRoomDto,
    @Request() req,
  ): Promise<ApiResponse> {
    const userId: string = req.user.id;
    const result = await this.chatService.createChatRoom(dto, userId);
    return new CreatedResponseDto('Chat room created', result);
  }

  @Get('rooms')
  async getChatRooms(@Request() req): Promise<ApiResponse> {
    const userId: string = req.user.id;
    const result = await this.chatService.getChatRooms(userId);
    return new GetResponseDto('Chat rooms retrieved', result);
  }

  @Get('rooms/:roomId')
  async getChatRoom(
    @Param('roomId') roomId: string,
    @Request() req,
  ): Promise<ApiResponse> {
    const userId: string = req.user.id;
    const result = await this.chatService.getChatRoomById(roomId, userId);
    return new GetResponseDto('Chat room retrieved', result);
  }


  @Get('messages')
  async getMessages(@Query() dto: GetMessagesDto): Promise<ApiResponse> {
    const result = await this.chatService.getMessages(dto);
    return new GetResponseDto('Messages retrieved', result);
  }

 
  @Post('messages')
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Request() req,
  ): Promise<ApiResponse> {
    const userId: string = req.user.id;
    const result = await this.chatService.sendMessage(dto, userId);
    return new CreatedResponseDto('Message queued', result);
  }

  
  @Post('messages/attachment')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const unique = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async sendMessageWithAttachment(
    @Body() dto: SendMessageDto,
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType:
              /(jpg|jpeg|png|gif|webp|mp4|mov|avi|pdf|doc|docx|xls|xlsx|zip|rar)$/,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ): Promise<ApiResponse> {
    const userId: string = req.user.id;
    const result = await this.chatService.sendMessage(dto, userId, file);
    return new CreatedResponseDto('Message with attachment queued', result);
  }


  @Get('users/:userId/online')
  async isUserOnline(@Param('userId') userId: string): Promise<ApiResponse> {
    const isOnline = await this.chatService.isUserOnline(userId);
    return new GetResponseDto('User status retrieved', { isOnline });
  }
}
