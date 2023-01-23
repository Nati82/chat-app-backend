import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class MessageDto {
  @ApiProperty()
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
