import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UUIDVersion } from 'class-validator';
import * as fs from 'fs';

import { User } from 'src/auth/entities/User.Entity';
import { UserService } from 'src/user/user.service';

import { MessageDto } from './dtos/message.dto';
import { Message } from './entities/Message.Entity';
import { File } from './entities/File.Entity';
import { FriendsWithMessage } from './entities/FriendsWithMessage.entity';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(FriendsWithMessage)
    private friendsWithMess: Repository<FriendsWithMessage>,
    @InjectRepository(Message) private message: Repository<Message>,
    @InjectRepository(File) private file: Repository<File>,
    private userService: UserService,
    private authService: AuthService,
  ) {}

  async removeFiles(f) {
    fs.promises.rm(`${f.destination}/${f.filename}`, {
      force: true,
      recursive: true,
    });
  }

  async verifyFileAccess(messageId: string, userId: string) {
    const message = await this.friendsWithMess
      .createQueryBuilder('friends_with_messages')
      .leftJoinAndSelect('friends_with_messages.addedBy', 'addedBy')
      .leftJoinAndSelect('friends_with_messages.acceptedBy', 'acceptedBy')
      .where('friends_with_messages.id = :messageId', { messageId })
      .getOne();

    if (message.addedBy.id != userId || message.acceptedBy.id != userId)
      return false;

    return true;
  }

  async friendsWithMessage(sentBy: string, sentTo: string) {
    return this.friendsWithMess.findOne({
      where: [
        {
          acceptedBy: sentTo,
          addedBy: sentBy,
        },
        {
          acceptedBy: sentBy,
          addedBy: sentTo,
        },
      ],
    });
  }

  async sendMessage(
    fileValidationError: string,
    user: Partial<User>,
    files: Array<Express.Multer.File>,
    newMessage: MessageDto,
  ) {
    const { id } = user;

    if (fileValidationError && fileValidationError.length) {
      files.forEach((f) => this.removeFiles(f));
      throw new BadRequestException({
        message: fileValidationError,
      });
    }

    let friendWith = await this.friendsWithMessage(id, newMessage.sentTo);

    if (!friendWith) {
      const friend = await this.userService.isFriend(id, newMessage.sentTo);

      if (!friend) {
        files.forEach((f) => this.removeFiles(f));
        throw new BadRequestException({
          message: 'You can only send messages to your friends!',
        });
      }

      const tempFriendWith = {
        acceptedBy: await this.authService.findOne({
          id: friend.acceptedBy['id'],
        }),
        addedBy: await this.authService.findOne({ id: friend.addedBy['id'] }),
      };
      const newFriendWith = this.friendsWithMess.create(tempFriendWith);
      friendWith = await this.friendsWithMess.save(newFriendWith);
    }

    newMessage.sentBy = id;
    newMessage.date = new Date();
    const { message, date, sentBy, sentTo } = newMessage;

    const createdMessage = this.message.create({
      message,
      sentBy,
      sentTo,
      date,
      friendsWithMess: friendWith,
    });

    const savedMessage = await this.message.save(createdMessage);

    if (!savedMessage) {
      files.forEach((f) => this.removeFiles(f));
      throw new BadRequestException({
        message: 'message not sent. please try again',
      });
    }

    const newFiles = files.map((f) => {
      return this.file.create({
        file: `${f.destination}/${f.filename}`,
        date: new Date(),
        message: savedMessage,
      });
    });

    const savedFiles = await this.file.save(newFiles);

    if (!savedFiles) {
      files.forEach((f) => this.removeFiles(f));
    }
    return this.message
      .createQueryBuilder('messages')
      .leftJoinAndSelect('messages.files', 'files')
      .where('messages.id = :messageId', { messageId: savedMessage.id })
      .getOne();
  }

  async viewFriendsWithMessage(userId: UUIDVersion, page: number) {
    const friendsWithMessages = [];
    const count = await this.friendsWithMess
      .createQueryBuilder('friends_with_messages')
      .where('friends_with_messages.acceptedBy = :userId', { userId })
      .orWhere('friends_with_messages.addedBy = :userId', { userId })
      .getCount();

    const pages = Math.floor(count / 50) + 1;
    if (page > pages) page = pages;
    const friendsWith = await this.friendsWithMess.find({
      where: [
        {
          acceptedBy: userId,
        },
        {
          addedBy: userId,
        },
      ],
      take: 50,
      skip: (page - 1) * 50,
    });

    for await (const f of friendsWith) {
      const mess = await this.message
        .createQueryBuilder('messages')
        .leftJoinAndSelect('messages.files', 'files')
        .leftJoinAndSelect('messages.friendsWithMess', 'friendsWithMess')
        .where('messages.friendsWithMess = :friendId', { friendId: f.id })
        .orderBy('messages.date', 'DESC')
        .getOne();
      friendsWithMessages.push({ ...f, lastMessage: { ...mess } });
    }

    friendsWithMessages.sort((a, b) => b.lastMessage.date - a.lastMessage.date)
    
    return { friendsWithMessages, page, pages };
  }

  async viewMessages(friendWithMessId: string, page: number) {
    const count = await this.message
      .createQueryBuilder('messages')
      .where('messages.friendsWithMess = :friendWithMessId', {
        friendWithMessId,
      })
      .getCount();

    const pages = Math.floor(count / 50) + 1;
    if (page > pages) page = pages;

    const messages = await this.message
      .createQueryBuilder('messages')
      .leftJoinAndSelect('messages.files', 'files')
      .leftJoinAndSelect('messages.friendsWithMess', 'friendsWithMess')
      .where('messages.friendsWithMess = :friendWithMessId', {
        friendWithMessId,
      })
      .orderBy('messages.date', 'DESC')
      .take(50)
      .skip((page - 1) * 50)
      .getMany();

    return { messages, page, pages };
  }

  async editMessage(messageId: string, message: string) {
    const { affected } = await this.message
      .createQueryBuilder('messages')
      .update()
      .set({
        message,
      })
      .where('id= :messageId', { messageId })
      .execute();

    if (affected) {
      return this.message
        .createQueryBuilder('messages')
        .leftJoinAndSelect('messages.files', 'files')
        .where('messages.id = :messageId', { messageId })
        .getOne();
    }

    throw new NotFoundException({
      message: 'update unsuccessful',
    });
  }

  async deleteMessage(_username: string, messageId: string[]) {
    const messages = await this.message.find({ id: In(messageId) });
    
    messages.forEach((m) => {
      if (m && m.files) {
        m.files.forEach(async (f) => {
          await fs.promises.rm(`./files/${f}`, {
            recursive: true,
            force: true,
          });
        });
      }
    });
    const { affected } = await this.message.delete({ id: In(messageId) });

    if (affected) return messages;

    throw new NotFoundException({
      message: 'delete unsuccessful',
    });
  }
}
