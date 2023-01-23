import { Expose, Type } from 'class-transformer';
import { UserDto } from 'src/auth/dtos/user.dto';

export class FriendReqDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => UserDto)
  addedBy: UserDto;

  @Expose()
  @Type(() => UserDto)
  requestedTo: UserDto;
}
