import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ProfileDto } from './profile.dto';

export class UserDto {
  @Expose()
  access_token: string;

  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  bio: string;

  @Expose()
  @Type(() => ProfileDto)
  profile: ProfileDto[];
}
