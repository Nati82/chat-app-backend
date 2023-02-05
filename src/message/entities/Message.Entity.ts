import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { File } from './File.Entity';
import { FriendsWithMessage } from './FriendsWithMessage.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  message: string;

  @OneToMany(() => File, (file) => file.message)
  files: File[];

  @Column('timestamp')
  date: Date;

  @ManyToOne(() => FriendsWithMessage, (fwm) => fwm.id, { eager: true })
  friendsWithMess: FriendsWithMessage;
}
