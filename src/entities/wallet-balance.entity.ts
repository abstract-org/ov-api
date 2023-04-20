import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('wallet_balances')
export class WalletBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('float')
  balance: number;

  @CreateDateColumn()
  created_at: Date;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  quest_hash: string;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  wallet_hash: string;
}
