import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  JoinColumn,
} from 'typeorm';
import { Quest } from './quest.entity';
import { ApiProperty } from '@nestjs/swagger';
import { POOL_KIND, POOL_TYPE } from '../helpers/constants';

@Entity({ name: 'pools' })
export class Pool extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty()
  @Column()
  hash!: string;

  @ApiProperty({
    enum: POOL_TYPE,
    example: POOL_TYPE.VALUE_LINK,
  })
  @Column()
  type!: string;

  @ApiProperty({
    enum: POOL_KIND,
    example: POOL_KIND.CITATION,
  })
  @Column({ nullable: true })
  kind?: string;

  @ApiProperty()
  @Column('json', { nullable: true })
  positions?: any;

  @ApiProperty()
  @CreateDateColumn()
  created_at!: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  published_at?: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updated_at!: Date;

  @ApiProperty()
  @Column({ nullable: true })
  quest_left_hash?: string;

  @ManyToOne(() => Quest, (quest) => quest.quest_left_pools)
  @JoinColumn({ name: 'quest_left_hash', referencedColumnName: 'hash' })
  quest_left!: Quest;

  @ApiProperty()
  @Column({ nullable: true })
  quest_right_hash?: string;

  @ManyToOne(() => Quest, (quest) => quest.quest_right_pools)
  @JoinColumn({ name: 'quest_right_hash', referencedColumnName: 'hash' })
  quest_right!: Quest;
}
