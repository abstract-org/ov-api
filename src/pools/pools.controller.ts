import { Controller, Post, Body } from '@nestjs/common';
import { PoolsService } from './pools.service';
import { Pool } from '../entities/pool.entity';
import { CreatePoolsDto } from '../dtos/create-pools.dto';
import { CreateValueLinksDto } from '../dtos/create-value-links.dto';
import { CreatePositionsDto } from '../dtos/create-positions.dto';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('api')
@Controller()
export class PoolsController {
  constructor(private readonly poolsService: PoolsService) {}

  @Post('pools')
  @ApiOperation({ summary: 'creates quest pools' })
  @ApiCreatedResponse({
    description: 'QuestPools have been successfully created.',
    type: Pool,
    isArray: true,
  })
  async createPools(@Body() createPoolsDto: CreatePoolsDto) {
    return this.poolsService.createPools(createPoolsDto.pools);
  }

  @Post('value-links')
  @ApiOperation({ summary: 'creates value-links' })
  @ApiCreatedResponse({
    description: 'Value-link Pools have been successfully created.',
    type: Pool,
    isArray: true,
  })
  async createValueLink(
    @Body() createValueLinksDto: CreateValueLinksDto,
  ): Promise<Pool[]> {
    return this.poolsService.createValueLinks(createValueLinksDto.pools);
  }

  @Post('position')
  @ApiOperation({ summary: 'opens positions' })
  @ApiCreatedResponse({
    description: 'Positions have been successfully created.',
    type: Pool,
    isArray: true,
  })
  async createPosition(
    @Body() createPositionsDto: CreatePositionsDto,
  ): Promise<Pool[]> {
    return this.poolsService.createPositions(createPositionsDto.positions);
  }
}
