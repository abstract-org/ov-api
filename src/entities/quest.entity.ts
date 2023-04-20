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

@Entity({ name: 'quests' })
export class Quest extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  hash!: string;

  @Column()
  kind!: string;

  @Column()
  content!: string;

  @Column()
  creator_hash!: string;

  @OneToMany(() => Pool, (pool) => pool.quest_left)
  quest_left_pools!: Pool[];

  @OneToMany(() => Pool, (pool) => pool.quest_right)
  quest_right_pools!: Pool[];

  @Column('float')
  initial_balance!: number;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  published_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at?: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
