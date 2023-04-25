import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from 'typeorm';
import { Pool } from './pool.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'quests' })
export class Quest extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column()
  hash!: string;

  @ApiProperty()
  @Column()
  kind!: string;

  @ApiProperty()
  @Column()
  content!: string;

  @ApiProperty()
  @Column()
  creator_hash!: string;

  @OneToMany(() => Pool, (pool) => pool.quest_left)
  quest_left_pools!: Pool[];

  @OneToMany(() => Pool, (pool) => pool.quest_right)
  quest_right_pools!: Pool[];

  @ApiProperty()
  @Column('float')
  initial_balance!: number;

  @ApiProperty()
  @CreateDateColumn()
  created_at!: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  published_at?: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  deleted_at?: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at!: Date;
}
