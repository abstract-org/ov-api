import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateQuestDto {
  @IsString()
  @IsNotEmpty()
  readonly kind: string;

  @IsString()
  @IsNotEmpty()
  readonly content: string;

  @IsString()
  readonly creator_hash?: string;

  @IsNumber()
  readonly initial_balance: number;
}
