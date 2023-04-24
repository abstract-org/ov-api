import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePositionDto } from './create-position.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePositionsDto {
  @ApiProperty({
    description: 'List of position data',
    type: () => [CreatePositionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePositionDto)
  readonly positions: CreatePositionDto[];
}
