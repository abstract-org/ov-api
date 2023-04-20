import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  BaseEntity,
} from 'typeorm';

@Entity({ name: 'pool_states' })
export class PoolState extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('float')
  cur_liq!: number;

  @Column('float')
  cur_price!: number;

  @Column('float')
  cur_pp!: number;

  @Column('float')
  cur_left!: number;

  @Column('float')
  cur_right!: number;

  @Column('float')
  quest_left_price!: number;

  @Column('float')
  quest_right_price!: number;

  @Column('float', { nullable: true })
  quest_left_volume?: number;

  @Column('float', { nullable: true })
  quest_right_volume?: number;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ nullable: true })
  block_hash?: string;

  @Column({ nullable: true })
  pool_hash?: string;
}
