import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePoolDto } from './create-pool.dto';

export class CreatePoolsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePoolDto)
  readonly pools: CreatePoolDto[];
}
