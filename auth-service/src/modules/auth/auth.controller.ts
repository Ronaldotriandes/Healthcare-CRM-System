import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ResponseDto } from 'src/utils/dto/response.dto';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto): Promise<ResponseDto> {
    const result = await this.authService.register(dto);
    return new ResponseDto('Registration successful', result);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<ResponseDto> {
    const result = await this.authService.login(loginDto);
    return new ResponseDto('Login successful', result);
  }

  /**
   * validateToken — dipanggil oleh service lain untuk verifikasi token
   * Header: Authorization: Bearer <token>
   * Guard global (JwtAuthGuard) sudah memvalidasi token sebelum handler ini jalan
   */
  @Get('users')
  async getUsers(): Promise<ResponseDto> {
    const users = await this.authService.getUsers();
    return new ResponseDto('Users fetched', users);
  }

  @Get('validate-token')
  async validateToken(@Request() req): Promise<ResponseDto> {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return new ResponseDto('Token valid', {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
    });
  }
}
