import {
  Body,
  Controller,
  Delete,
  Param,
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
import { ApiBody, ApiConsumes, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from './dtos/login-user.dto';
import { UpdateUserDto } from './dtos/updateUser.dto';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { ResponseMessage } from 'src/common/dtos/responseMessage.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ type: UserDto })
  @ApiBody({ type: CreateUserDto })
  @Post('/signup')
  @Serialize(UserDto)
  @UseInterceptors(FileInterceptor('profile'))
  async signup(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateUserDto,
  ) {
    const { fileValidationError } = req;
    return this.authService.signup(fileValidationError, file, body);
  }

  @ApiOkResponse({ type: UserDto })
  @ApiBody({ type: LoginUserDto })
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @Serialize(UserDto)
  async login(@Req() req: any) {
    return this.authService.login(req.user);
  }

  @ApiSecurity('bearer')
  @ApiOkResponse({ type: UserDto })
  @ApiBody({ type: UpdateUserDto})
  @UseGuards(JwtAuthGuard)
  @Patch('/update')
  @Serialize(UserDto)
  async update(
    @Req() req: any,
    @Body() params: Partial<User>,
  ) {
    const { id } = req.user;
    return this.authService.update(id, params);
  }

  @ApiSecurity('bearer')
  @ApiOkResponse({ type: UserDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateUserDto})
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('profile'))
  @Patch('/changeProfilePic')
  @Serialize(UserDto)
  async changeProfilePic(
    @Req() req: any,
    @UploadedFile() file,
    @Body() params: Partial<User>,
  ) {
    const { id } = req.user;
    const { fileValidationError } = req;
    return this.authService.changeProfilePic(id, fileValidationError, file);
  }

  @ApiSecurity('bearer')
  @ApiOkResponse({ type: UserDto })
  @UseGuards(JwtAuthGuard)
  @Patch('/changePassword')
  @Serialize(UserDto)
  async changePassword(@Req() req: any, @Body() password: ChangePasswordDto) {
    const { id } = req.user;
    const { newPassword } = password;
    return this.authService.changePassword(id, newPassword)
  }

  @ApiSecurity('bearer')
  @ApiOkResponse({ type: ResponseMessage })
  @UseGuards(JwtAuthGuard)
  @Delete('/deleteProfilePic/:filename')
  @Serialize(ResponseMessage)
  async deleteProfilePic(@Req() req: any, @Param('filename') filename: string) {
    const { user } = req;
    const message = await this.authService.deleteProfilePic(user, filename);
    console.log(`message: ${message.message}`);
    return message;
  }

  @ApiSecurity('bearer')
  @ApiOkResponse({ type: UserDto })
  @UseGuards(JwtAuthGuard)
  @Delete('/delete')
  @Serialize(UserDto)
  async delete(@Req() req: any) {
    const { id } = req.user;
    return this.authService.delete(id);
  }
}
