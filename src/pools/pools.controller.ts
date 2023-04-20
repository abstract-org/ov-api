import { Controller, Post, Body } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { Pool } from '../entities/pool.entity';
import { CreatePoolsDto } from '../dtos/create-pools.dto';
import { CreateValueLinksDto } from '../dtos/create-value-links.dto';

@Controller()
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Post()
  async createPools(@Body() createPoolsDto: CreatePoolsDto) {
    return this.poolsService.createPools(createPoolsDto.pools);
  }

  @Post('value-links')
  async createValueLink(
    @Body() createValueLinksDto: CreateValueLinksDto,
  ): Promise<Pool[]> {
    return this.poolsService.createValueLinks(createValueLinksDto.pools);
  }
}
