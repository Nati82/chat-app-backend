import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { ProfileDto } from './profile.dto';

export class ProfilePicDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  profile: ProfileDto[];
}
