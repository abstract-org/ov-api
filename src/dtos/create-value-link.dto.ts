import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { POOL_KIND } from '../helpers/constants';

export class CreateValueLinkDto {
  @ApiProperty({
    enum: POOL_KIND,
    example: POOL_KIND.CITATION,
  })
  @IsString()
  @IsNotEmpty()
  readonly kind: string;

  @ApiProperty({
    example: 'f7a1924f3cba8ef6023709c1e90c5f504c5627f4d32cdc98c5df147198a95432',
  })
  @IsString()
  @IsNotEmpty()
  readonly quest_left_hash: string;

  @ApiProperty({
    example: 'c632fc950f470f485e370bb3354d4b049faf71c1aa6101026800bad3e37e0e8b',
  })
  @IsString()
  @IsNotEmpty()
  readonly quest_right_hash: string;
}
