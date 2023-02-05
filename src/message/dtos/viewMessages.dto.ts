import { Expose, Type } from 'class-transformer';
import { ViewMessageDto } from './viewMessage.dto';

export class ViewMessagesDto {
  @Expose()
  @Type(() => ViewMessageDto)
  messages: ViewMessageDto[];

  @Expose()
  page: number;

  @Expose()
  pages: number;
}
