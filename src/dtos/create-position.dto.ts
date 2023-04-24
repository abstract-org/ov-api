import { IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePositionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly cited_quest: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly citing_quest: string;

  @ApiProperty({ required: false })
  @IsNumber()
  readonly amount: number;
}
