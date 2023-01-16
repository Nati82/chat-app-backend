import { IsArray, IsUUID, UUIDVersion } from 'class-validator';

export class DeleteMessageDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  messages: UUIDVersion[];
}
