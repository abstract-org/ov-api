import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePoolDto {
  @IsString()
  @IsNotEmpty()
  readonly quest_hash: string;
}
