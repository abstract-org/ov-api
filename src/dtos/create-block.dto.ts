export class CreateBlockDto {
  action!: string;
  amount_in?: number;
  amount_out?: number;
  path?: any;
  pool_hash?: string;
}
