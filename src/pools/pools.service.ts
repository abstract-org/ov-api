import { Pool } from '../entities/pool.entity';
import { Repository } from 'typeorm';
import { CreatePoolDto } from '../dtos/create-pool.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateValueLinkDto } from '../dtos/create-value-link.dto';

@Injectable()
export class PoolsService {
  constructor(
    @InjectRepository(Pool)
    private readonly poolRepository: Repository<Pool>,
  ) {}

  async createPool(createPoolDto: CreatePoolDto): Promise<Pool> {
    const pool = this.poolRepository.create(createPoolDto);
    await this.poolRepository.save(pool);
    return pool;
  }

  async createValueLink(createPoolDto: CreateValueLinkDto): Promise<Pool> {
    const pool = this.poolRepository.create(createPoolDto);
    await this.poolRepository.save(pool);
    return pool;
  }
}
