import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePoolDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly quest_hash: string;
}
