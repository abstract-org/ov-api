import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateValueLinkDto } from './create-value-link.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateValueLinksDto {
  @ApiProperty({
    description: 'List of value-link data',
    type: () => [CreateValueLinkDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateValueLinkDto)
  readonly pools: CreateValueLinkDto[];
}
