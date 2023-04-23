import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePositionDto } from './create-position.dto';

export class CreatePositionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePositionDto)
  readonly positions: CreatePositionDto[];
}
