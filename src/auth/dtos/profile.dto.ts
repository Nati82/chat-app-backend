import { Expose } from 'class-transformer';

export class ProfileDto {
  @Expose()
  id: string;

  @Expose()
  profile: string;

  @Expose()
  date: Date;
}
