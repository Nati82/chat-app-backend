import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/entities/User.Entity';
import { UserModule } from './user/user.module';
import { Friend } from './user/entities/Friend.Entity';
import { FriendRequest } from './user/entities/FriendRequest.Entity';
import { MessageModule } from './message/message.module';
import { Message } from './message/entities/Message.Entity';
import { Profile } from './auth/entities/Profile.Entity';
import { File } from './message/entities/File.Entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'Chat-App',
      password: 'chatapp',
      database: 'chat-app',
      entities: [User, Friend, FriendRequest, Message, Profile, File],
      synchronize: true,
    }),
    AuthModule,
    UserModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
