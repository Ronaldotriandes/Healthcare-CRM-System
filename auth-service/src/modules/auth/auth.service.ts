import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'libs/prisma/src';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

interface User {
  id: string;
  email: string;
  password: string;
  fullname?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = {
      id: user.id,
      email: user.email,
      sub: user.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        fullname: user.fullname || 'admin',
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const datauser = await this.prismaService.user.findFirst({
        where: {
          email: email,
        },
        select: {
          id: true,
          email: true,
          password: true,
          fullname: true,
        },
      });

      if (datauser && (await bcrypt.compare(password, datauser.password))) {
        return {
          id: datauser.id,
          email: datauser.email,
          password: datauser.password,
          fullname: datauser.fullname,
        };
      }
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prismaService.user.create({
      data: {
        email: dto.email,
        fullname: dto.name,
        password: hashedPassword,
      },
    });
    const payload = { id: user.id, email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, fullname: user.fullname },
    };
  }

  async getUsers(): Promise<{ id: string; fullname: string; email: string }[]> {
    return this.prismaService.user.findMany({
      select: { id: true, fullname: true, email: true },
      orderBy: { fullname: 'asc' },
    });
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const payload = this.jwtService.verify(token);
      return this.validateUserById(payload.sub);
    } catch {
      return null;
    }
  }

  async validateUserById(id: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
        password: true,
        fullname: true,
      },
    });
    if (user) {
      return {
        id: user.id,
        email: user.email,
        password: user.password,
        fullname: user.fullname,
      };
    }
    return null;
  }
}
