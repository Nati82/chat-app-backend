import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserDto } from 'src/auth/dtos/user.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddFriendDto } from './dtos/add-friend.dto';
import { FriendReqDto } from './dtos/friend-request.dto';
import { FriendDto } from './dtos/friend.dto';
import { UserService } from './user.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('searchUser')
  @Serialize(UserDto)
  async searchUser(@Query('username') username: string) {
    return this.userService.searchUser(username);
  }

  @UseGuards(JwtAuthGuard)
  @Post('addFriend')
  @Serialize(FriendReqDto)
  async addFriend(@Req() req: any, @Body() friend: AddFriendDto) {
    const { id } = req.user;
    return this.userService.addFriend(id, friend);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getFriendRequests')
  @Serialize(FriendReqDto)
  async getFriendRequests(@Req() req: any) {
    const requestedTo = req.user.id;
    return this.userService.getFriendRequests(requestedTo);
  }

  @UseGuards(JwtAuthGuard)
  @Post('acceptRequest')
  @Serialize(FriendDto)
  async acceptRequest(@Req() req: any, @Body() request: any) {
    const userId = req.user.id;
    const { requestId } = request;
    return this.userService.acceptRequest(requestId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('denyRequest')
  @Serialize(FriendReqDto)
  async denyRequest(@Body() request: any) {
    const { requestId } = request;
    return this.userService.denyRequest(requestId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('searchFriends')
  @Serialize(FriendDto)
  async searchFriends(@Query('username') username: string, @Req() req: any) {
    return this.userService.searchFriends(username, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('friends')
  @Serialize(FriendDto)
  async friends(@Req() req: any) {
    return this.userService.friends(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('removeFriend')
  @Serialize(FriendDto)
  async removeRequest(@Body() request: any) {
    const { friendId } = request;
    return this.userService.removeFriend(friendId);
  }
}
