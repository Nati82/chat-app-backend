import {
  BadRequestException,
  HttpStatus,
  UseFilters,
  UseGuards,
  ValidationPipe,
  WsExceptionFilter,
} from '@nestjs/common';
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
import { Socket, Namespace } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/auth/entities/User.Entity';
import { JwtAuthSocketGuard } from 'src/auth/guards/jwt-auth-socket.guard';
import { UserService } from 'src/user/user.service';
import { DeleteMessageDto } from './dtos/deleteMessages.dto';
import { EditMessageDto } from './dtos/editMessage.dto';
import { MessageDto } from './dtos/message.dto';
import { MessageService } from './message.service';

@WebSocketGateway({
  namespace: 'chat',
})
// @UseGuards(JwtAuthSocketGuard)
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private messageService: MessageService,
    private userService: UserService,
    private authService: AuthService,
  ) {}

  @WebSocketServer() io: Namespace;
  connectedUsers: Map<string, User> = new Map();

  async emitClientToFriends(userId: string) {
    for (const [key, value] of this.connectedUsers) {
      const friendWith = await this.userService.isFriend(value.id, userId);

      if (friendWith) {
        friendWith.acceptedBy['password'] = '';
        friendWith.addedBy['password'] = '';

        if (
          friendWith.acceptedBy['id'] === value.id &&
          friendWith.addedBy['id'] === userId
        ) {
          this.io.to(key).emit('user_connected', friendWith.addedBy);
        } else if (
          friendWith.addedBy['id'] === value.id &&
          friendWith.acceptedBy['id'] === userId
        ) {
          this.io.to(key).emit('user_connected', friendWith.acceptedBy);
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
    console.log(`connected client id: ${client.id}`);
    console.log(`headers: ${client.handshake.headers.userid}`);
    console.log(`sockets: ${this.io.sockets.size}`);
    const newConnectedUser = await this.authService.findOne({
      id: client.handshake.headers.userid,
    });

    if (newConnectedUser) this.connectedUsers.set(client.id, newConnectedUser);
    console.log(`connected: ${this.connectedUsers.get(client.id).username}`);

    await this.emitFriendsToClient(client.id, newConnectedUser.id);
    await this.emitClientToFriends(newConnectedUser.id);
  }
  handleDisconnect(client: Socket) {
    console.log(`disconnected client id: ${client.id}`);
    console.log(`sockets: ${this.io.sockets.size}`);
    const disconnectedUser = this.connectedUsers.get(client.id);
    this.connectedUsers.delete(client.id);
    this.io.emit('user_disconnected', disconnectedUser);
    console.log(`disconnected: ${!this.connectedUsers.has(client.id)}`);
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody(new ValidationPipe())
    payload: [MessageDto, ArrayBuffer] | MessageDto,
  ) {
    // console.log(Object.keys(payload));
    // console.log(Object.values(payload));

    if ((payload as any[]).length && payload[1]) {
      // Todo: implement send file
    } else {
      const message = await this.messageService.sendMessage(
        null,
        this.connectedUsers.get(client.id),
        null,
        payload as MessageDto,
      );

      if (message) {
        const sentTo = Array.from(this.connectedUsers).find(
          ([_key, val]) => val.id === message.sentTo,
        );

        if (sentTo) {
          this.io.to(sentTo[0]).emit('new_message', message);
        }
        return message;
      }
      throw new WsException({ message: 'message not sent' });
    }
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
    try {
      const deletedMessages = await this.messageService.deleteMessage(
        client.handshake.headers.userid as string,
        messages,
      );

      if (deletedMessages) {
        const sentTos = Array.from(this.connectedUsers).map(([key, val]) => {
          for (const dm of deletedMessages) {
            dm.friendsWithMess = null;
            if (dm.sentTo === val.id)
            return key;
          }
        });

        if (sentTos && sentTos.length !== 0) {
          sentTos.forEach((sentTo) =>
            this.io.to(sentTo).emit('deleted_message', deletedMessages),
          );

          return deletedMessages;
        }
      }
    } catch {
      throw new WsException({ message: 'message not deleted' });
    }
  }
}
