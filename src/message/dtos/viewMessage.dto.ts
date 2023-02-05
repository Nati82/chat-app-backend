import { Expose, Type } from 'class-transformer';
import { FileDto } from './file.dto';

export class ViewMessageDto {
  @Expose()
  id: string;

  @Expose()
  message: string;

  @Expose()
  @Type(() => FileDto)
  files: FileDto[];

  @Expose()
  date: Date;
  
}
