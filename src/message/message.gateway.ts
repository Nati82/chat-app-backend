import { BadRequestException, HttpStatus, UseFilters, UseGuards, ValidationPipe, WsExceptionFilter } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { JwtAuthSocketGuard } from 'src/auth/guards/jwt-auth-socket.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MessageDto } from './dtos/message.dto';

@WebSocketGateway({
  namespace: 'chat',
})
@UseGuards(JwtAuthSocketGuard)
export class MessageGateway {
  @SubscribeMessage('message')
  handleMessage(client: any,@MessageBody(new ValidationPipe({ errorHttpStatusCode: 400 })) payload: MessageDto) {
    console.log(payload);
  }
}
