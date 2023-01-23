import { User } from 'src/auth/entities/User.Entity';
import {
  AfterInsert,
  AfterRemove,
  AfterUpdate,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
} from 'typeorm';

@Entity('friends')
export class Friend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  adUsername: string;

  @Column()
  acUsername: string;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  addedBy: string;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  acceptedBy: string;

  @AfterInsert()
  logInsert() {
    console.log('Inserted a friend with id', this.id);
  }

  @AfterUpdate()
  logUpdate() {
    console.log('Updated a friend with id', this.id);
  }

  @AfterRemove()
  logRemove() {
    console.log('Removed a friend with id', this.id);
  }
}
