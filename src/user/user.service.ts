import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UUIDVersion } from 'class-validator';
import { AuthService } from 'src/auth/auth.service';
import { Repository, Like } from 'typeorm';
import { AddFriendDto } from './dtos/add-friend.dto';
import { Friend } from './entities/Friend.Entity';
import { FriendRequest } from './entities/FriendRequest.Entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Friend) private friend: Repository<Friend>,
    @InjectRepository(FriendRequest)
    private friendRequest: Repository<FriendRequest>,
    private authService: AuthService,
  ) {}

  async searchUser(username: string) {
    return this.authService.find(username);
  }

  async addFriend(id: UUIDVersion, friend: AddFriendDto) {
    const addedById = await this.authService.findOne({ id });
    const requestedToId = await this.authService.findOne({
      id: friend.requestedToId,
    });
    const request: Partial<FriendRequest> = {
      addedBy: addedById,
      requestedTo: requestedToId,
    };
    const result = this.friendRequest.create(request);
    const newFriend = await this.friendRequest.save(result);

    if (newFriend) return newFriend;

    throw new BadRequestException({
      message: 'friend request unsuccessful',
    });
  }

  async getFriendRequests(requestedTo: UUIDVersion) {
    return this.friendRequest.find({ where: { requestedTo } });
  }

  async acceptRequest(id: UUIDVersion, userId: UUIDVersion) {
    const request = await this.friendRequest.findOne({ id });

    if (request && userId === request.requestedTo.id) {
      //fix later with transaction
      const friend: Partial<Friend> = {
        adUsername: request.addedBy.username,
        acUsername: request.requestedTo.username,
        addedBy: request.addedBy.id as UUIDVersion,
        acceptedBy: request.requestedTo.id as UUIDVersion,
      };
      const newFriend = this.friend.create(friend);
      await this.friendRequest.delete(id);
      return this.friend.save(newFriend);
    }
    throw new BadRequestException({
      message: 'accept friend request unsuccessful',
    });
  }

  async denyRequest(id: UUIDVersion) {
    const deniedRequest = await this.friendRequest.findOne(id);
    const { affected } = await this.friendRequest.delete(id);

    if (affected) return deniedRequest;

    throw new NotFoundException({
      message: 'request not found',
    });
  }

  async searchFriends(username: string, id: UUIDVersion) {
    return this.friend.find({
      where: [
        {
          addedBy: id,
          acUsername: Like(`%${username}%`),
        },
        {
          addedBy: id,
          adUsername: Like(`%${username}%`),
        },
        {
          acceptedBy: id,
          acUsername: Like(`%${username}%`),
        },
        {
          acceptedBy: id,
          adUsername: Like(`%${username}%`),
        },
      ],
    });
  }

  async friends(friendId: UUIDVersion) {
    return this.friend.find({
      where: [
        {
          addedBy: friendId,
        },
        {
          acceptedBy: friendId,
        },
      ],
    });
  }

  async friendsWithMessage(sentBy: string, sentTo: string) {
    return this.friend.findOne({
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

  async removeFriend(id: string) {
    const friend = this.friend.findOne(id);
    const { affected } = await this.friend.delete(id);

    if (affected) return friend;

    throw new NotFoundException({
      message: 'friend not found',
    });
  }
}
