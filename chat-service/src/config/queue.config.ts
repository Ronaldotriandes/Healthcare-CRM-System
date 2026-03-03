import { BullModuleOptions } from '@nestjs/bull';

export const queueConfig: BullModuleOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 1000,
    attempts: 3, 
    backoff: {
      type: 'exponential',
      delay: 2000, 
    },
  },
};
