import { IsNumber, IsArray, ArrayMinSize } from 'class-validator';

export class CreatePositionDto {
  @IsNumber()
  readonly pool_id: number;

  @IsArray()
  @ArrayMinSize(2)
  readonly range: [number, number];

  @IsArray()
  @ArrayMinSize(2)
  readonly amounts: [number, number];
}
