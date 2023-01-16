import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import * as fs from 'fs';

import { AuthModule } from 'src/auth/auth.module';
import { Message } from './entities/Message.Entity';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { UserModule } from 'src/user/user.module';
import { File } from './entities/File.Entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, File]),
    MulterModule.register({
      storage: diskStorage({
        destination: async function (req, _file, cb) {
          const user = req.user['username'];
          const date = new Date().toISOString().split('T')[0];
          await fs.promises.mkdir(`./files/${user}/${date}`, {
            recursive: true,
          });
          cb(null, `./files/${user}/${date}`);
        },
        filename: (_req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
      fileFilter: function (req, file, cb) {
        if (file.originalname.match(/\.(zh|exe|bash|sh)$/)) {
          req.fileValidationError =
            'executable or scripting files are not allowed!';
          return cb(null, false);
        }

        cb(null, true);
      },
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule {}
