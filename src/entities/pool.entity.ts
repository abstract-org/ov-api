import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from 'typeorm';
import { Quest } from './quest.entity';

@Entity({ name: 'pools' })
export class Pool extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  hash!: string;

  @Column()
  type!: string;

  @Column({ nullable: true })
  kind?: string;

  @Column('json', { nullable: true })
  positions?: any;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  published_at?: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ nullable: true })
  quest_left_hash?: string;

  @ManyToOne(() => Quest, (quest) => quest.quest_left_pools)
  quest_left!: Quest;

  @Column({ nullable: true })
  quest_right_hash?: string;

  @ManyToOne(() => Quest, (quest) => quest.quest_right_pools)
  quest_right!: Quest;
}
