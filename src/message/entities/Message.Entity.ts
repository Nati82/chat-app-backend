import { UUIDVersion } from 'class-validator';
import { User } from 'src/auth/entities/User.Entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { File } from './File.Entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: UUIDVersion;

  @Column()
  message: string;

  @OneToMany(() => File, (file) => file.message)
  files: File[];

  @Column('date')
  date: Date;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  sentTo: UUIDVersion;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  sentBy: UUIDVersion;
}
