import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestDto {
  @ApiProperty({ description: 'Part of the hash' })
  @IsString()
  @IsNotEmpty()
  readonly kind: string;

  @ApiProperty({ description: 'Part of the hash' })
  @IsString()
  @IsNotEmpty()
  readonly content: string;

  @ApiProperty({ required: false })
  @IsString()
  readonly creator_hash?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  readonly initial_balance: number;
}
