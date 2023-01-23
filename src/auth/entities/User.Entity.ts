import {
  AfterInsert,
  AfterRemove,
  AfterUpdate,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { Profile } from './Profile.Entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  firstname: string;

  @Column()
  lastname: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column()
  bio: string;

  @OneToMany(() => Profile, (profile) => profile.user)
  profile: Profile[];

  @AfterInsert()
  logInsert() {
    console.log('Inserted a user with id', this.id);
  }

  @AfterUpdate()
  logUpdate() {
    console.log('Updated a user with id', this.id);
  }

  @AfterRemove()
  logRemove() {
    console.log('Removed a user with id', this.id);
  }
}
