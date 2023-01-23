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
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserDto } from 'src/auth/dtos/user.dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddFriendDto } from './dtos/add-friend.dto';
import { FriendReqDto } from './dtos/friend-request.dto';
import { FriendDto } from './dtos/friend.dto';
import { UserService } from './user.service';

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiOkResponse({ type: [UserDto] })
  @ApiQuery({ name: 'username', type: 'string'})
  @UseGuards(JwtAuthGuard)
  @Get('searchUser')
  @Serialize(UserDto)
  async searchUser(@Query('username') username: string) {
    return this.userService.searchUser(username);
  }

  @ApiOkResponse({ type: FriendReqDto })
  @ApiBody({ type: AddFriendDto })
  @UseGuards(JwtAuthGuard)
  @Post('addFriend')
  @Serialize(FriendReqDto)
  async addFriend(@Req() req: any, @Body() friend: AddFriendDto) {
    const { id } = req.user;
    return this.userService.addFriend(id, friend);
  }

  @ApiOkResponse({ type: [FriendReqDto] })
  @UseGuards(JwtAuthGuard)
  @Get('getFriendRequests')
  @Serialize(FriendReqDto)
  async getFriendRequests(@Req() req: any) {
    const requestedTo = req.user.id;
    return this.userService.getFriendRequests(requestedTo);
  }

  @ApiOkResponse({ type: FriendDto })  
  @ApiBody({ type: FriendReqDto })
  @UseGuards(JwtAuthGuard)
  @Post('acceptRequest')
  @Serialize(FriendDto)
  async acceptRequest(@Req() req: any, @Body() request: FriendReqDto) {
    const userId = req.user.id;
    const requestId  = request.id;
    return this.userService.acceptRequest(requestId, userId);
  }

  @ApiOkResponse({ type: FriendReqDto })
  @ApiBody({ type: FriendReqDto })
  @UseGuards(JwtAuthGuard)
  @Delete('denyRequest')
  @Serialize(FriendReqDto)
  async denyRequest(@Body() request: FriendReqDto) {
    const requestId = request.id;
    return this.userService.denyRequest(requestId);
  }

  @ApiOkResponse({ type: [FriendDto] })
  @ApiQuery({ name: 'username', type: 'string' })
  @UseGuards(JwtAuthGuard)
  @Get('searchFriends')
  @Serialize(FriendDto)
  async searchFriends(@Query('username') username: string, @Req() req: any) {
    return this.userService.searchFriends(username, req.user.id);
  }

  @ApiOkResponse({ type: [FriendDto] })
  @UseGuards(JwtAuthGuard)
  @Get('friends')
  @Serialize(FriendDto)
  async friends(@Req() req: any) {
    return this.userService.friends(req.user.id);
  }

  @ApiOkResponse({ type: FriendDto })
  @ApiBody({ type: FriendDto })
  @UseGuards(JwtAuthGuard)
  @Delete('removeFriend')
  @Serialize(FriendDto)
  async removeRequest(@Body() request: FriendDto) {
    const friendId = request.id;
    return this.userService.removeFriend(friendId);
  }
}
