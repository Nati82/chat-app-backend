import { Expose, Type } from 'class-transformer';
import { UserDto } from 'src/auth/dtos/user.dto';

export class FriendDto {
  @Expose()
  id: string;

  @Expose()
  adUsername: string;

  @Expose()
  acUsername: string;

  @Expose()
  @Type(() => UserDto)
  addedBy: UserDto;

  @Expose()
  @Type(() => UserDto)
  acceptedBy: UserDto;
}
