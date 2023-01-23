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

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message) private message: Repository<Message>,
    @InjectRepository(File) private file: Repository<File>,
    private userService: UserService,
  ) {}

  async sendMessage(
    fileValidationError: string,
    user: Partial<User>,
    files: Array<Express.Multer.File>,
    message: MessageDto,
  ) {
    const { id } = user;
    const removeFiles = (f) => {
      fs.promises.rm(`${f.destination}/${f.filename}`, {
        force: true,
        recursive: true,
      });
    };

    if (fileValidationError && fileValidationError.length) {
      throw new BadRequestException({
        message: fileValidationError,
      });
    }

    const friend = await this.userService.friendsWithMessage(
      id,
      message.sentTo,
    );

    if (!friend) {
      throw new BadRequestException({
        message: 'You can only send messages to your friends!',
      });
    }

    message.sentBy = id;
    message.date = new Date();

    const newMessage = this.message.create(message);

    const savedMessage = await this.message.save(newMessage);

    if (!savedMessage) {
      files.forEach(removeFiles);
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
      files.forEach(removeFiles);
    }
    return this.message
      .createQueryBuilder('messages')
      .leftJoinAndSelect('messages.files', 'files')
      .where('messages.id = :messageId', { messageId: savedMessage.id })
      .getOne();
  }

  async viewFriendsWithMessage(userId: UUIDVersion, page: number) {
    return this.message
      .createQueryBuilder('messages')
      .distinctOn(['messages.sentBy', 'messages.sentTo'])
      .leftJoinAndSelect('messages.sentBy', 'sentBy')
      .leftJoinAndSelect('messages.sentTo', 'sentTo')
      .leftJoinAndSelect('messages.files', 'files')
      .where('sentBy.id = :userId', { userId })
      .orWhere('sentTo.id = :userId', { userId })
      .take(50)
      .skip((page - 1) * 50)
      .getMany();
  }

  async viewMessages(userId: string, friendId: string, page: number) {
    /* 
      This method needs to be fixed
     */

    return this.message
      .createQueryBuilder('messages')
      .leftJoinAndSelect('messages.files', 'files')
      .where('messages.sentBy.id = :userId', { userId })
      .andWhere('messages.sentTo.id = :friendId', { friendId })
      .orderBy('messages.date', 'DESC')
      .take(50)
      .skip((page - 1) * 50)
      .getMany();
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
      m.files.forEach(async (f) => {
        await fs.promises.rm(`./files/${f}`, {
          recursive: true,
          force: true,
        });
      });
    });
    const { affected } = await this.message.delete({ id: In(messageId) });

    if (affected) return messages;

    throw new NotFoundException({
      message: 'delete unsuccessful',
    });
  }
}
