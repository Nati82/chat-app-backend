import {
  BadRequestException,
  HttpStatus,
  UseFilters,
  UseGuards,
  ValidationPipe,
  WsExceptionFilter,
} from '@nestjs/common';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { User } from 'src/auth/entities/User.Entity';
import { JwtAuthSocketGuard } from 'src/auth/guards/jwt-auth-socket.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UserService } from 'src/user/user.service';
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
      if (friendWith)
        if (friendWith.acceptedBy['id'] === value.id) {
          console.log(`emitted user acceptedBy ${friendWith.acceptedBy['id']} && value id: ${value.id}`);
          this.io.to(key).emit('user_connected', friendWith.acceptedBy);
        } else if (friendWith.addedBy['id'] === value.id) {
          console.log(`emitted user addedBy ${friendWith.addedBy['id']} && value id: ${value.id}`);
          this.io.to(key).emit('user_connected', friendWith.addedBy);
        }
    }
  }

  async emitFriendsToClient(clientId: string, userId: string) {
    const connectedFriends: any[] = [];

    for (const [key, value] of this.connectedUsers) {
      const friendWith = await this.userService.isFriend(value.id, userId);
      if (friendWith && key !== clientId)
        if (friendWith.acceptedBy['id'] === value.id) {
          connectedFriends.push(friendWith.acceptedBy);
        } else if (friendWith.addedBy['id'] === value.id){
          connectedFriends.push(friendWith.addedBy);
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
    client: Socket,
    @MessageBody(new ValidationPipe())
    payload: [MessageDto, ArrayBuffer],
  ) {
    // console.log(Object.keys(payload));
    // console.log(Object.values(payload));
    if (payload.length && payload[1]) {
      // Todo: implement send file
    } else {
      const message = await this.messageService.sendMessage(
        null,
        this.connectedUsers.get(client.id),
        null,
        payload[0],
      );
      if (message) {
        const sentTo = Array.from(this.connectedUsers).find(
          ([_key, val]) => val.id === message.sentTo,
        );
        const sent = this.io.to(sentTo[0]).emit('new_message', message);

        if (sent) return message;
      }
      throw new WsException({ message: 'message not sent' });
    }
  }
}
