import {
  Body,
  Controller,
  Delete,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from './entities/User.Entity';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { UserDto } from './dtos/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from './dtos/login-user.dto';

@ApiTags('auth')
@Controller('auth')
@Serialize(UserDto)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  @UseInterceptors(FileInterceptor('profile'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateUserDto })
  async signup(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateUserDto,
  ) {
    const { fileValidationError } = req;
    return this.authService.signup(fileValidationError, file, body);
  }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @ApiBody({ type: LoginUserDto })
  async login(@Req() req: any) {
    return this.authService.login(req.user);
  }

  @ApiSecurity('bearer')
  @UseGuards(JwtAuthGuard)
  @Patch('/update')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profile'))
  @ApiBody({ type: UserDto})
  async update(
    @Req() req: any,
    @UploadedFile() file,
    @Body() params: Partial<User>,
  ) {
    const { id } = req.user;
    const { fileValidationError } = req;
    return this.authService.update(id, fileValidationError, file, params);
  }

  @ApiSecurity('bearer')
  @UseGuards(JwtAuthGuard)
  @Delete('/delete')
  async delete(@Req() req: any) {
    const { id } = req.user;
    return this.authService.delete(id);
  }
}
