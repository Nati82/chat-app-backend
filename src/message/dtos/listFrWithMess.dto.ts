import { Expose, Type } from 'class-transformer';
import { ViewFriendsWithMessDto } from './viewFriendsWithMess.dto';

export class ListFriendsWithMessDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => ViewFriendsWithMessDto)
  friendsWithMessages: ViewFriendsWithMessDto;

  @Expose()
  page: number;

  @Expose()
  pages: number;
  
}

