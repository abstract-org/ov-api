import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateValueLinkDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly kind: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly quest_left_hash: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly quest_right_hash: string;
}
