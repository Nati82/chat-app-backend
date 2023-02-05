import { Expose, Type } from 'class-transformer';
import { User } from '../entities/User.Entity';

export class ProfileDto {
  @Expose()
  id: string;

  @Expose()
  profile: string;

  @Expose()
  date: Date;

  @Expose()
  @Type(() => User)
  userId: string
}
