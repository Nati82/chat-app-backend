import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UUIDVersion } from 'class-validator';
import { Serialize } from 'src/interceptors/serialize.interceptor';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeleteMessageDto } from './dtos/deleteMessages.dto';
import { EditMessageDto } from './dtos/editMessage.dto';
import { MessageDto } from './dtos/message.dto';
import { ViewMessagesDto } from './dtos/viewMessages.dto';
import { MessageService } from './message.service';

@Controller('message')
@Serialize(ViewMessagesDto)
export class MessageController {
  constructor(private messageService: MessageService) {}

  @UseGuards(JwtAuthGuard)
  @Post('sendMessage')
  @UseInterceptors(FilesInterceptor('files'))
  async sendMessage(
    @Req() req: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() request: MessageDto,
  ) {
    const { fileValidationError, user } = req;
    return this.messageService.sendMessage(
      fileValidationError,
      user,
      files,
      request,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('viewFriendsWithMessage/:page')
  async viewFriendsWithMessage(@Req() req: any, @Param('page') page: number) {
    const { id } = req.user;

    if (isNaN(page)) {
      throw new BadRequestException({
        message: 'page must be a number!',
      });
    }

    return this.messageService.viewFriendsWithMessage(id, page);
  }

  @UseGuards(JwtAuthGuard)
  @Get('viewMessages/:page/:friendId')
  async viewMessages(
    @Req() req: any,
    @Param('page') page: number,
    @Param('friendId') friendId: UUIDVersion,
  ) {
    const { id } = req.user;
    return this.messageService.viewMessages(id, friendId, page);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('editMessage')
  async editMessage(@Body() body: EditMessageDto) {
    console.log('body', body);
    const { messageId, message } = body;
    return this.messageService.editMessage(messageId, message);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('deleteMessages')
  async deleteMessage(@Req() req: any, @Body() body: DeleteMessageDto) {
    const { username } = req.user;
    const { messages } = body;
    return this.messageService.deleteMessage(username, messages);
  }
}
