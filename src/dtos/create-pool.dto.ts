import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePoolDto {
  @ApiProperty({
    example: 'f7a1924f3cba8ef6023709c1e90c5f504c5627f4d32cdc98c5df147198a95432',
  })
  @IsString()
  @IsNotEmpty()
  readonly quest_hash: string;
}
