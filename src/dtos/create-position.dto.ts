import { IsNumber, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePositionDto {
  @ApiProperty({
    example: 'f7a1924f3cba8ef6023709c1e90c5f504c5627f4d32cdc98c5df147198a95432',
  })
  @IsString()
  @IsNotEmpty()
  readonly cited_quest: string;

  @ApiProperty({
    example: 'c632fc950f470f485e370bb3354d4b049faf71c1aa6101026800bad3e37e0e8b',
  })
  @IsString()
  @IsNotEmpty()
  readonly citing_quest: string;

  @ApiProperty({ default: 100, required: false })
  @IsNumber()
  @IsOptional()
  readonly amount?: number;

  @ApiProperty({ default: 2, required: false })
  @IsNumber()
  @IsOptional()
  readonly price_range_multiplier?: number;
}
