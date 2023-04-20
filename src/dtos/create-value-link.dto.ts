import { IsString, IsNotEmpty } from 'class-validator';

export class CreateValueLinkDto {
  @IsString()
  @IsNotEmpty()
  readonly kind: string;

  @IsString()
  @IsNotEmpty()
  readonly quest_left_hash: string;

  @IsString()
  @IsNotEmpty()
  readonly quest_right_hash: string;
}
