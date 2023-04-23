import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty()
  readonly cited_quest: string;

  @IsString()
  @IsNotEmpty()
  readonly citing_quest: string;

  @IsNumber()
  readonly amount: number;
}
