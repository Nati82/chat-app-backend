import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Like, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/User.Entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { isUUID, UUIDVersion } from 'class-validator';
import * as fs from 'fs';
import { Profile } from './entities/Profile.Entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private user: Repository<User>,
    @InjectRepository(Profile)
    private profile: Repository<Profile>,
    private jwtService: JwtService,
  ) {}

  async signup(
    fileValidationError: string,
    file: Express.Multer.File,
    params: CreateUserDto,
  ) {
    const userExists = await this.findOne(params.username);

    if (userExists) {
      throw new BadRequestException({
        message: 'username already exists',
      });
    }

    if (fileValidationError && fileValidationError.length) {
      throw new BadRequestException({
        message: fileValidationError,
      });
    }

    const saltOrRounds = 10;
    const hash = await bcrypt.hash(params.password, saltOrRounds);
    params.password = hash;

    const newUser = this.user.create({ ...params });

    const savedUser = await this.user.save(newUser);

    if (savedUser) {
      const newProfile = this.profile.create({
        profile: `${file.destination}/${file.filename}`,
        date: new Date(),
      });

      newProfile.user = savedUser;
      const profile = await this.profile.save(newProfile);

      if (!profile) {
        await fs.promises.rm(`./files/${params.username}/profile`, {
          recursive: true,
          force: true,
        });
      }

      const { id } = savedUser;
      const user = await this.user
        .createQueryBuilder('users')
        .leftJoinAndSelect('users.profile', 'profiles')
        .where('users.id = :id', { id })
        .getOne();

      return this.login(user);
    }

    throw new BadRequestException({
      message: 'signup unsuccessful',
    });
  }

  async findOne(username: any) {
    if (username.id && isUUID(username.id)) {
      const id = username.id as UUIDVersion;
      return this.user
        .createQueryBuilder('users')
        .leftJoinAndSelect('users.profile', 'profiles')
        .where('users.id = :id', { id })
        .getOne();
    }
    return this.user
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.profile', 'profiles')
      .where('users.username = :username', { username })
      .getOne();
  }

  async find(username: string) {
    return this.user
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.profile', 'profiles')
      .where('users.username like :username', { username: `%${username}%` })
      .getMany();
  }

  async login(newUser: User) {
    const { password, ...user } = newUser;
    const payload = { username: user.username, id: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      ...user,
    };
  }

  async update(
    id: UUIDVersion,
    fileValidationError: string,
    file: Express.Multer.File,
    params: Partial<User>,
  ) {
    const user = await this.user
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.profile', 'profiles')
      .where('users.id = :id', { id })
      .getOne();

    if (params.password) {
      const saltOrRounds = 10;
      const hash = await bcrypt.hash(params.password, saltOrRounds);
      params.password = hash;
    }

    if (params.username) {
      if (await this.user.findOne({ username: params.username })) {
        throw new BadRequestException({
          message: 'username already exists',
        });
      }
    }

    if (fileValidationError && fileValidationError.length) {
      throw new BadRequestException({
        message: fileValidationError,
      });
    }

    const { affected } = await this.user
      .createQueryBuilder('users')
      .update()
      .set({
        ...params,
      })
      .where('users.id = :id', { id })
      .execute();

    if (affected === 0) {
      await fs.promises.rm(
        `./files/${user.username}/profile/${file.filename}`,
        {
          recursive: true,
          force: true,
        },
      );
      throw new BadRequestException({
        message: 'update was unsuccessful',
      });
    }

    const newProfile = this.profile.create({
      profile: `${file.destination}/${file.filename}`,
      date: new Date(),
    });

    newProfile.user = user;
    const profile = await this.profile.save(newProfile);

    if (!profile) {
      await fs.promises.rm(
        `./files/${user.username}/profile/${file.filename}`,
        {
          recursive: true,
          force: true,
        },
      );
    }

    return this.login(user);
  }

  async delete(id: UUIDVersion) {
    const user = await this.user.findOne(id);
    const res = await this.user.delete(id);
    if (res.affected && res.affected > 0) {
      await fs.promises.rm(`./files/${user.username}/profile`, {
        recursive: true,
        force: true,
      });
      return user;
    }

    throw new NotFoundException({
      message: 'user not found',
    });
  }
}
