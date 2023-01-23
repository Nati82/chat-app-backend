import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class EditMessageDto {
  @ApiProperty()
  @IsUUID()
  messageId: string;

  @ApiProperty()
  @IsString()
  message: string;
}
