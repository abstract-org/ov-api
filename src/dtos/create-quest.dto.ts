import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DEFAULT_INITIAL_BALANCE } from '../helpers/constants';

export class CreateQuestDto {
  @ApiProperty({
    description: 'Part of the hash',
    example: 'TITLE',
  })
  @IsString()
  @IsNotEmpty()
  readonly kind: string;

  @ApiProperty({
    description: 'Part of the hash',
    example: 'The title of article',
  })
  @IsString()
  @IsNotEmpty()
  readonly content: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  readonly creator_hash?: string;

  @ApiProperty({ default: DEFAULT_INITIAL_BALANCE, required: false })
  @IsNumber()
  @IsOptional()
  readonly initial_balance?: number;
}
