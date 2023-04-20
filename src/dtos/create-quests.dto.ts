import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestDto } from './create-quest.dto';

export class CreateQuestsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestDto)
  readonly quests: CreateQuestDto[];
}
