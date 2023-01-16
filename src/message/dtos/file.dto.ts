import { Expose } from 'class-transformer';

export class FileDto {
  @Expose()
  id: string;

  @Expose()
  file: string;

  @Expose()
  date: Date;
}
