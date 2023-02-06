import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/User.Entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalStrategy } from './strategies/local.strategy';
import { jwtConstants } from './constants';
import { JwtAuthService } from './jwt-auth.service';
import * as fs from 'fs';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Profile } from './entities/Profile.Entity';
import { JwtSocketStrategy } from './strategies/jwt-socket.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile]),
    MulterModule.register({
      storage: diskStorage({
        destination: async function (req, _file, cb) {
          const user = req.body['username']
            ? req.body['username']
            : req.user['username'];
          await fs.promises.mkdir(`./files/${user}/profile`, {
            recursive: true,
          });
          cb(null, `./files/${user}/profile`);
        },
        filename: (_req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
      fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)) {
          req.fileValidationError = 'only image files are allowed!';
          return cb(null, false);
        }

        cb(null, true);
      },
    }),
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '120000s' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthService, LocalStrategy, JwtStrategy, JwtSocketStrategy],
  exports: [AuthService],
})
export class AuthModule {}
