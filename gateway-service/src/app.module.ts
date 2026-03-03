import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloGatewayDriver, ApolloGatewayDriverConfig } from '@nestjs/apollo';
import {
  IntrospectAndCompose,
  RemoteGraphQLDataSource,
} from '@apollo/gateway';

/**
 * GraphQL Gateway Module
 *
 * Menggabungkan semua subgraph menjadi satu supergraph.
 * Frontend hanya butuh 1 endpoint: http://gateway:4000/graphql
 *
 * Header forwarding:
 * Authorization header dari client diteruskan ke setiap subgraph,
 * sehingga masing-masing service bisa memvalidasi token sendiri.
 */

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: { request: any; context: any }) {
    // Forward Authorization header dari client ke subgraph
    if (context?.req?.headers?.authorization) {
      request.http.headers.set(
        'authorization',
        context.req.headers.authorization,
      );
    }
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloGatewayDriverConfig>({
      driver: ApolloGatewayDriver,

      server: {
        // Expose req ke context untuk header forwarding
        context: ({ req }: { req: any }) => ({ req }),

        // Disable introspection di production
        introspection: process.env.NODE_ENV !== 'production',
      },

      gateway: {
        /**
         * IntrospectAndCompose — gateway otomatis introspect
         * schema dari setiap subgraph saat startup, lalu
         * menyusunnya menjadi satu unified supergraph.
         */
        supergraphSdl: new IntrospectAndCompose({
          subgraphs: [
            {
              name: 'chat',
              url: `${process.env.CHAT_SERVICE_URL || 'http://localhost:3002'}/graphql`,
            },
          ],
        }),

        /**
         * buildService — dipakai untuk inject custom DataSource
         * yang forward Authorization header ke subgraph.
         */
        buildService({ url }) {
          return new AuthenticatedDataSource({ url });
        },
      },
    }),
  ],
})
export class AppModule {}
