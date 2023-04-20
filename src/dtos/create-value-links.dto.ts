import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateValueLinkDto } from './create-value-link.dto';

export class CreateValueLinksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateValueLinkDto)
  readonly pools: CreateValueLinkDto[];
}
