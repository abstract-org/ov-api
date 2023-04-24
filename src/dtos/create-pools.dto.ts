import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePoolDto } from './create-pool.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePoolsDto {
  @ApiProperty({
    description: 'List of pools data',
    type: () => [CreatePoolDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoolDto)
  readonly pools: CreatePoolDto[];
}
