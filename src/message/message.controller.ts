import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Serialize } from 'src/interceptors/serialize.interceptor';

import * as fs from 'fs';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeleteMessageDto } from './dtos/deleteMessages.dto';
import { EditMessageDto } from './dtos/editMessage.dto';
import { ListFriendsWithMessDto } from './dtos/listFrWithMess.dto';
import { MessageDto } from './dtos/message.dto';
import { ViewMessageDto } from './dtos/viewMessage.dto';
import { ViewMessagesDto } from './dtos/viewMessages.dto';
import { MessageService } from './message.service';

@ApiTags('message')
@ApiBearerAuth()
@Controller('message')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @ApiOkResponse({ type: ViewMessageDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: MessageDto })
  @UseGuards(JwtAuthGuard)
  @Post('sendMessage')
  @UseInterceptors(AnyFilesInterceptor())
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

  @ApiOkResponse({ type: ListFriendsWithMessDto })
  @ApiParam({ name: 'page', type: 'number' })
  @UseGuards(JwtAuthGuard)
  @Get('viewFriendsWithMessage/:page')
  @Serialize(ListFriendsWithMessDto)
  async viewFriendsWithMessage(@Req() req: any, @Param('page') page: number) {
    const { id } = req.user;

    if(!page) page = 1;

    return this.messageService.viewFriendsWithMessage(id, page);
  }

  @Header('Content-Type', 'application/octet-stream')
  @UseGuards(JwtAuthGuard)
  @Get('/:messageId/:messageFile')
  async getMessageFile(
    @Param('messageId') messageId: string,
    @Param('messageFile') messageFile: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    const fPath = messageFile.slice(1, messageFile.length);
    const { id } = req.user;

    if (!(await this.messageService.verifyFileAccess(messageId, id))) {
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

  @ApiOkResponse({ type: [ViewMessagesDto] })
  @ApiParam({ name: 'page', type: 'number' })
  @ApiParam({ name: 'friendId' })
  @UseGuards(JwtAuthGuard)
  @Get('viewMessages/:page/:friendWithMessId')
  @Serialize(ViewMessagesDto)
  async viewMessages(
    @Param('page') page: number,
    @Param('friendWithMessId') friendWithMessId: string,
  ) {
    if(!page) page = 1;
    return this.messageService.viewMessages(friendWithMessId, page);
  }

  @ApiOkResponse({ type: ViewMessageDto })
  @ApiBody({ type: EditMessageDto })
  @UseGuards(JwtAuthGuard)
  @Patch('editMessage')
  @Serialize(ViewMessageDto)
  async editMessage(@Body() body: EditMessageDto) {
    const { messageId, message } = body;
    return this.messageService.editMessage(messageId, message);
  }

  @ApiOkResponse({ type: [ViewMessageDto] })
  @ApiBody({ type: DeleteMessageDto })
  @UseGuards(JwtAuthGuard)
  @Delete('deleteMessages')
  @Serialize(ViewMessageDto)
  async deleteMessage(@Req() req: any, @Body() body: DeleteMessageDto) {
    const { username } = req.user;
    const { messages } = body;
    return this.messageService.deleteMessage(username, messages);
  }
}
