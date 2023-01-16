import { Expose, Type } from 'class-transformer';
import { UserDto } from 'src/auth/dtos/user.dto';
import { FileDto } from './file.dto';

export class ViewMessagesDto {
  @Expose()
  id: string;

  @Expose()
  message: string;

  @Expose()
  @Type(() => FileDto)
  files: FileDto[];

  @Expose()
  date: Date;

  @Expose()
  @Type(() => UserDto)
  sentTo: UserDto;

  @Expose()
  @Type(() => UserDto)
  sentBy: UserDto;
}
