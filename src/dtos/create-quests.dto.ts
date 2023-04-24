import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuestDto } from './create-quest.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuestsDto {
  @ApiProperty({
    description: 'List of quest data',
    type: () => [CreateQuestDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestDto)
  readonly quests: CreateQuestDto[];
}
