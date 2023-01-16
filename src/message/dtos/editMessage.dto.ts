import { IsString, IsUUID, UUIDVersion } from 'class-validator';

export class EditMessageDto {
  @IsUUID()
  messageId: UUIDVersion;

  @IsString()
  message: string;
}
