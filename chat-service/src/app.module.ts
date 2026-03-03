import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { GraphQLModule } from '@nestjs/graphql';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { PrismaModule } from 'libs/prisma/src';
import { ChatModule } from './modules/chat/chat.module';
import { queueConfig } from './config/queue.config';
import { redisConfig } from './config/redis.config';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: { federation: 2 },
      sortSchema: true,
      context: ({ req }: { req: any }) => ({ req }),
    }),

    CacheModule.register({ ...redisConfig, isGlobal: true }),

    BullModule.forRoot(queueConfig),

    HttpModule.register({ timeout: 5000, maxRedirects: 3 }),

    PrismaModule,
    ChatModule,
  ],
})
export class AppModule {}
