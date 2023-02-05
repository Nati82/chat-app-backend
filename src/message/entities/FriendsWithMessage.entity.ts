import { User } from 'src/auth/entities/User.Entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';

@Entity('friends_with_messages')
export class FriendsWithMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  addedBy: User;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  acceptedBy: User;
}
