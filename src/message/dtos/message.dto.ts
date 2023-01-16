import { IsOptional, IsString, IsUUID, UUIDVersion } from 'class-validator';

export class MessageDto {
  @IsOptional()
  file: string;

  @IsString()
  message: string;

  @IsUUID()
  sentTo: UUIDVersion;

  @IsOptional()
  sentBy: UUIDVersion;

  @IsOptional()
  date: Date;
}
