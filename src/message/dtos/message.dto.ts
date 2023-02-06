import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class MessageDto {
  @ApiProperty({ type: ['string'], format: 'binary', required: false })
  @IsOptional()
  file: string[];

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsUUID()
  sentTo: string;

  @ApiProperty({required: false})
  @IsOptional()
  sentBy: string;

  @ApiProperty({ required: false, default: new Date() })
  @IsOptional()
  date: Date;
}
