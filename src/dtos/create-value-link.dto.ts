import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class CreateValueLinkDto {
  @IsString()
  @IsNotEmpty()
  readonly type: string;

  @IsString()
  @IsNotEmpty()
  readonly quest_left_hash: string;

  @IsString()
  @IsNotEmpty()
  readonly quest_right_hash: string;

  @IsObject()
  readonly positions: object;
}
