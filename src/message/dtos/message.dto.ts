import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class MessageDto {
  @ApiProperty({ type: 'string', format: 'binary'})
  @IsOptional()
  file: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsUUID()
  sentTo: string;

  @ApiProperty()
  @IsOptional()
  sentBy: string;

  @ApiProperty()
  @IsOptional()
  date: Date;
}
