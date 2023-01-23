import { User } from 'src/auth/entities/User.Entity';
import {
  AfterInsert,
  AfterRemove,
  AfterUpdate,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';

@Entity('friend_requests')
export class FriendRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  addedBy: User;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  requestedTo: User;

  @AfterInsert()
  logInsert() {
    console.log('Inserted  a friend request with id', this.id);
  }

  @AfterUpdate()
  logUpdate() {
    console.log('Updated a friend request with id', this.id);
  }

  @AfterRemove()
  logRemove() {
    console.log('Removed a friend request with id', this.id);
  }
}
