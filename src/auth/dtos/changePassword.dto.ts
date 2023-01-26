import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsOptional()
  newPassword: string;
}
