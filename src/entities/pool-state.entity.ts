import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'pool_states' })
export class PoolState extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column('float')
  cur_liq!: number;

  @ApiProperty()
  @Column('float')
  cur_price!: number;

  @ApiProperty()
  @Column('float')
  cur_pp!: number;

  @ApiProperty()
  @Column('float')
  cur_left!: number;

  @ApiProperty()
  @Column('float')
  cur_right!: number;

  @ApiProperty()
  @Column('float')
  quest_left_price!: number;

  @ApiProperty()
  @Column('float')
  quest_right_price!: number;

  @ApiProperty()
  @Column('float', { nullable: true })
  quest_left_volume?: number;

  @ApiProperty()
  @Column('float', { nullable: true })
  quest_right_volume?: number;

  @ApiProperty()
  @CreateDateColumn()
  created_at!: Date;

  @ApiProperty()
  @Column({ nullable: true })
  block_hash?: string;

  @ApiProperty()
  @Column({ nullable: true })
  pool_hash?: string;
}
