import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('blocks')
export class Block {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  hash: string;

  @Column({ type: 'varchar' })
  action: string;

  @Column({ type: 'double precision', nullable: true })
  amount_in: number;

  @Column({ type: 'double precision', nullable: true })
  amount_out: number;

  @Column({ type: 'jsonb' })
  path: object;

  @CreateDateColumn()
  created_at: Date;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  pool_hash: string;
}
