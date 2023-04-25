import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('api')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'healthcheck' })
  @ApiResponse({
    status: 200,
    description: 'The API is healthy',
    schema: {
      type: 'string',
      example: 'OpenValue API: OK',
    },
  })
  getOK(): string {
    return this.appService.getOK();
  }
}
