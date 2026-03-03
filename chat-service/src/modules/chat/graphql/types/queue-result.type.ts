import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType('QueueResult')
export class QueueResultType {
  @Field()
  jobId: string;

  @Field()
  message: string;
}
