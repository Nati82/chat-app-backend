import { UUIDVersion } from 'class-validator';
import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Message } from './Message.Entity';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: UUIDVersion;

  @Column()
  file: string;

  @Column()
  date: Date;

  @ManyToOne(() => Message, (message) => message.files)
  message: Message;
}
