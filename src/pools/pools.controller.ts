import { Controller, Post, Body } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { Pool } from '../entities/pool.entity';
import { CreatePoolsDto } from '../dtos/create-pools.dto';
import { CreateValueLinksDto } from '../dtos/create-value-links.dto';
import { CreatePositionsDto } from '../dtos/create-positions.dto';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('api')
@Controller()
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Post('pools')
  @ApiCreatedResponse({
    description: 'QuestPools have been successfully created.',
  })
  async createPools(@Body() createPoolsDto: CreatePoolsDto) {
    return this.poolsService.createPools(createPoolsDto.pools);
  }

  @Post('value-links')
  @ApiCreatedResponse({
    description: 'Value-link Pools have been successfully created.',
  })
  async createValueLink(
    @Body() createValueLinksDto: CreateValueLinksDto,
  ): Promise<Pool[]> {
    return this.poolsService.createValueLinks(createValueLinksDto.pools);
  }

  @Post('position')
  @ApiCreatedResponse({
    description: 'Positions have been successfully created.',
  })
  async createPosition(
    @Body() createPositionsDto: CreatePositionsDto,
  ): Promise<Pool[]> {
    return this.poolsService.createPositions(createPositionsDto.positions);
  }
}
