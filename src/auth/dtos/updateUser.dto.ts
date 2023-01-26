import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsPhoneNumber, IsString, IsUUID } from 'class-validator';
import { ProfileDto } from './profile.dto';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  username: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firstname: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastname: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({ required: false })
  @IsPhoneNumber()
  @IsOptional()
  phone: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bio: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  profile: ProfileDto[];
}
