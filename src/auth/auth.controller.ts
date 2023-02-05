import {
  BadRequestException,
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
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import * as fs from 'fs';
import { LoginUserDto } from './dtos/login-user.dto';
import { UpdateUserDto } from './dtos/updateUser.dto';
import { ChangePasswordDto } from './dtos/changePassword.dto';
import { ResponseMessage } from 'src/common/dtos/responseMessage.dto';
import { ProfilePicDto } from './dtos/profilePic.dto';
import { ProfileDto } from './dtos/profile.dto';
import { Get, Header, Res } from '@nestjs/common/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOkResponse({ type: UserDto })
  @ApiConsumes('multipart/form-data')
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

  @ApiOkResponse({ type: [ProfileDto] })
  @UseGuards(LocalAuthGuard)
  @Get('/getProfilePics/:userId')
  @Serialize(ProfileDto)
  async getProfilePics(@Param('userId') userId: string) {
    return this.authService.getProfilePics(userId);
  }
  
  @ApiSecurity('bearer')
  @Header('Content-Type', 'image/jpeg')
  @UseGuards(JwtAuthGuard)
  @Get('/:profilePics')
  async getImages(@Param('profilePics') profilePics: string, @Res() res: any) {
    const fPath = profilePics.slice(1, profilePics.length);
    const fpathArray = fPath.split('/');

    if (fpathArray[1] != 'files' && fpathArray[3] != 'profile') {
      throw new BadRequestException({ message: 'not allowed' });
    }
    const file = fs.createReadStream(`${process.cwd()}${fPath}`);
    file.pipe(res);

    file.on('error', (e) => {
      res.format({
        'application/json'() {
          res.status(400).json({ message: e.message });
        },
      });
    });
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
  @ApiBody({ type: UpdateUserDto })
  @UseGuards(JwtAuthGuard)
  @Patch('/update')
  @Serialize(UserDto)
  async update(@Req() req: any, @Body() params: Partial<User>) {
    const { id } = req.user;
    return this.authService.update(id, params);
  }

  @ApiSecurity('bearer')
  @ApiOkResponse({ type: [ProfileDto] })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ProfilePicDto })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('profile'))
  @Patch('/changeProfilePic')
  @Serialize(ProfileDto)
  async changeProfilePic(@Req() req: any, @UploadedFile() file) {
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
    return this.authService.changePassword(id, newPassword);
  }

  @ApiSecurity('bearer')
  @ApiOkResponse({ type: ResponseMessage })
  @UseGuards(JwtAuthGuard)
  @Delete('/deleteProfilePic/:filename')
  @Serialize(ResponseMessage)
  async deleteProfilePic(@Req() req: any, @Param('filename') filename: string) {
    const { user } = req;
    return this.authService.deleteProfilePic(user, filename);
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
