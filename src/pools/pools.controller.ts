import { Controller, Post, Body } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { Pool } from '../entities/pool.entity';
import { CreatePoolDto } from '../dtos/create-pool.dto';
import { CreateValueLinkDto } from '../dtos/create-value-link.dto';

@Controller('pools')
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Post()
  async createPool(@Body() createPoolDto: CreatePoolDto): Promise<Pool> {
    return await this.poolsService.createPool(createPoolDto);
  }

  @Post('value-link')
  async createValueLink(
    @Body() createValueLinkDto: CreateValueLinkDto,
  ): Promise<Pool> {
    return await this.poolsService.createValueLink(createValueLinkDto);
  }
}
