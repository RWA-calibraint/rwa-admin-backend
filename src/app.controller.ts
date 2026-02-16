import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SkipAuth } from 'src/shared-kernel/utils/custom-decorators/skip-auth.decorator';

@SkipAuth()
@ApiTags('Health')
@Controller()
export class AppController {
  @Get('/health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is up and running',
    type: 'object',
    schema: { example: { status: 'Ok' } },
  })
  healthCheck(): { status: 'Ok' } {
    return { status: 'Ok' };
  }
}
