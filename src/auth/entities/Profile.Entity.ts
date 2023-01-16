import { UUIDVersion } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User.Entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: UUIDVersion;

  @Column()
  profile: string;

  @Column()
  date: Date;

  @ManyToOne(() => User, (user) => user.profile)
  user: User;
}
