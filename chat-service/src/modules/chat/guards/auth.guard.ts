import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GqlExecutionContext } from '@nestjs/graphql';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly authServiceUrl =
    process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

  constructor(private readonly httpService: HttpService) {}

  private getRequest(context: ExecutionContext) {
    if (context.getType<string>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext().req;
    }
    return context.switchToHttp().getRequest();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);
    const authHeader = request.headers['authorization'] as string | undefined;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/auth/validate-token`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );

      request.user = data.result;
      return true;
    } catch (error) {
      this.logger.warn(`Token validation failed: ${error?.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
