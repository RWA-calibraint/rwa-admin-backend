import { Global, Module } from '@nestjs/common';

import { CognitoService } from 'src/shared-kernel/utils/services/aws/cognito.service';

@Global()
@Module({
  providers: [CognitoService],
  exports: [CognitoService],
})
export class AwsSdkModule {}
