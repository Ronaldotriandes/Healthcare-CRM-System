import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis';

export const redisConfig: CacheModuleOptions = {
  store: redisStore as any,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  ttl: 300,
};
