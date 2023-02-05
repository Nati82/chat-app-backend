import { Expose, Type } from 'class-transformer';
import { UserDto } from 'src/auth/dtos/user.dto';
import { FileDto } from './file.dto';
import { ViewMessageDto } from './viewMessage.dto';

export class ViewFriendsWithMessDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => UserDto)
  addedBy: UserDto;

  @Expose()
  @Type(() => UserDto)
  acceptedBy: UserDto;

  @Expose()
  message: string;

  @Expose()
  @Type(() => FileDto)
  files: FileDto[];

  @Expose()
  date: Date;

  @Expose()
  @Type(() => ViewMessageDto)
  lastMessage: ViewMessageDto;
  
}
