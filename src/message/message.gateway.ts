import {
  BadRequestException,
  HttpStatus,
  UploadedFiles,
  UseFilters,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
  WsExceptionFilter,
} from '@nestjs/common';
import {
  AnyFilesInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import multer from 'multer';
import { Socket, Namespace } from 'socket.io';
import * as fs from 'fs';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/auth/entities/User.Entity';
import { JwtAuthSocketGuard } from 'src/auth/guards/jwt-auth-socket.guard';
import { UserService } from 'src/user/user.service';
import { DeleteMessageDto } from './dtos/deleteMessages.dto';
import { EditMessageDto } from './dtos/editMessage.dto';
import { MessageDto } from './dtos/message.dto';
import { MessageService } from './message.service';
import { buffer } from 'stream/consumers';
import { encode } from 'punycode';
import { AsyncApiPub, AsyncApiSub } from 'nestjs-asyncapi';

@WebSocketGateway({
  namespace: 'chat',
  maxHttpBufferSize: 1e8,
})
// @UseGuards(JwtAuthSocketGuard)
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() io: Namespace;
  connectedUsers: Map<string, User> = new Map();

  constructor(
    private messageService: MessageService,
    private userService: UserService,
    private authService: AuthService,
  ) {}

  async emitClientToFriends(userId: string, event: string) {
    for (const [key, value] of this.connectedUsers) {
      const friendWith = await this.userService.isFriend(value.id, userId);

      if (friendWith) {
        friendWith.acceptedBy['password'] = '';
        friendWith.addedBy['password'] = '';

        if (
          friendWith.acceptedBy['id'] === value.id &&
          friendWith.addedBy['id'] === userId
        ) {
          this.io.to(key).emit(event, friendWith.addedBy);
        } else if (
          friendWith.addedBy['id'] === value.id &&
          friendWith.acceptedBy['id'] === userId
        ) {
          this.io.to(key).emit(event, friendWith.acceptedBy);
        }
      }
    }
  }

  async emitFriendsToClient(clientId: string, userId: string) {
    const connectedFriends: any[] = [];

    for (const [key, value] of this.connectedUsers) {
      const friendWith = await this.userService.isFriend(value.id, userId);
      if (friendWith && key !== clientId) {
        friendWith.acceptedBy['password'] = '';
        friendWith.addedBy['password'] = '';

        if (
          friendWith.acceptedBy['id'] === value.id &&
          friendWith.addedBy['id'] === userId
        ) {
          connectedFriends.push(friendWith.acceptedBy);
        } else if (
          friendWith.addedBy['id'] === value.id &&
          friendWith.acceptedBy['id'] === userId
        ) {
          connectedFriends.push(friendWith.addedBy);
        }
      }
    }

    this.io.to(clientId).emit('connected_friends', connectedFriends);
  }

  async handleConnection(client: Socket) {
    const newConnectedUser = await this.authService.findOne({
      id: client.handshake.headers.userid,
    });

    if (newConnectedUser) this.connectedUsers.set(client.id, newConnectedUser);

    await this.emitFriendsToClient(client.id, newConnectedUser.id);
    await this.emitClientToFriends(newConnectedUser.id, 'user_connected');
  }

  async handleDisconnect(client: Socket) {
    const disConnectedUser = this.connectedUsers.get(client.id);
    await this.emitClientToFriends(disConnectedUser.id, 'user_disconnected');
    this.connectedUsers.delete(client.id);
  }
  @AsyncApiSub({
    channel: 'send_message',
    message: {
      payload: MessageDto
    },
  })
  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe())
    payload: [MessageDto, ArrayBuffer] | MessageDto,
  ) {
    console.log(payload[1])
    console.log(Object.values(Buffer.from(payload[1]).toString('base64url')))
    const username = await this.authService.findOne({
            id: client.handshake.headers.userid,
          });
          const date = new Date().toISOString().split('T')[0];
          await fs.promises.mkdir(`./files/${username.username}/${date}`, {
            recursive: true,
          });
          await fs.promises.writeFile(`./files/${username.username}/${date}/symonette.makeassessmentwork.dweck_.pdf`, payload[1]);
        
    // const upload = multer({
    //   storage: ({
    //     destination: async function (req, _file, cb) {
    //       const username = req.user['username'];
    //       const date = new Date().toISOString().split('T')[0];
    //       cb(null, `./files/${username}/${date}`);
    //     },
    //     filename: (_req, file, cb) => {
    //       cb(null, file.originalname);
    //     },
    //   }),
    //   fileFilter: function (req, file, cb) {
    //     if (file.originalname.match(/\.(zh|exe|bash|sh)$/)) {
    //       fileValidationError =
    //         'executable or scripting files are not allowed!';
    //       return cb(null, false);
    //     }

    //     cb(null, true);
    //   },
    // })
    // console.log('payload', payload[1].toString());

    // if ((payload as any[]).length && payload[1]) {
    //   try {
    //     const username = await this.authService.findOne({
    //       id: client.handshake.headers.userid,
    //     });
    //     const date = new Date().toISOString().split('T')[0];
    //     await fs.promises.mkdir(`./files/${username.username}/${date}`, {
    //       recursive: true,
    //     });
    //     await fs.promises.writeFile(`./files/${username.username}/${date}/symonette.makeassessmentwork.dweck_.pdf`, payload[1]);
    //   } catch (error) {
    //     console.log('error', error);
    //     throw new WsException({ message: 'message not sent' });
    //   }
    // } else {
    //   const message = await this.messageService.sendMessage(
    //     null,
    //     this.connectedUsers.get(client.id),
    //     null,
    //     payload as MessageDto,
    //   );

    //   if (message) {
    //     const sentTo = Array.from(this.connectedUsers).find(
    //       ([_key, val]) => val.id === message.sentTo,
    //     );

    //     if (sentTo) {
    //       this.io.to(sentTo[0]).emit('new_message', message);
    //     }
    //     return message;
    //   }
    //   throw new WsException({ message: 'message not sent' });
    // }
  }

  @SubscribeMessage('edit_message')
  async editMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe())
    payload: EditMessageDto,
  ) {
    const { messageId, message } = payload;
    const editedMessage = await this.messageService.editMessage(
      client.handshake.headers.userid as string,
      messageId,
      message,
    );

    if (editedMessage) {
      const sentTo = Array.from(this.connectedUsers).find(
        ([_key, val]) => val.id === editedMessage.sentTo,
      );

      if (sentTo) {
        const sentBy = Array.from(this.connectedUsers).find(
          ([_key, val]) => editedMessage.sentBy === val.id,
        );

        this.io
          .to([sentTo[0], sentBy[0]])
          .emit('edited_message', editedMessage);

        return;
      }
    }
    throw new WsException({ message: 'message not edited' });
  }

  @SubscribeMessage('delete_messages')
  async deleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe())
    payload: DeleteMessageDto,
  ) {
    const { messages } = payload;

    const deletedMessages = await this.messageService.deleteMessage(
      client.handshake.headers.userid as string,
      messages,
    );

    if (deletedMessages) {
      const sentTos = Array.from(this.connectedUsers).map(([key, val]) => {
        for (const dm of deletedMessages) {
          dm.friendsWithMess = null;
          if (dm.sentTo === val.id) return key;
        }
      });

      if (sentTos && sentTos.length !== 0) {
        sentTos.forEach((sentTo) =>
          this.io.to(sentTo).emit('deleted_messages', deletedMessages),
        );

        return deletedMessages;
      }
    }

    throw new WsException({ message: 'message not deleted' });
  }
}
