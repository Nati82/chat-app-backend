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
import * as fsExtra from 'fs-extra';
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


  async removeFile(filename: string) {
    return fs.promises.rm(filename, {
      recursive: true,
      force: true,
    });
  }
  
  async signup(
    fileValidationError: string,
    file: Express.Multer.File,
    params: CreateUserDto,
  ) {
    const userExists = await this.findOne(params.username);

    if (userExists) {
      await this.removeFile(`./files/${params.username}/profile`);
      throw new BadRequestException({
        message: 'username already exists',
      });
    }

    if (fileValidationError && fileValidationError.length) {
      await this.removeFile(`./files/${params.username}/profile`)
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
        await this.removeFile(`./files/${params.username}/profile`);
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
    id: string,
    params: Partial<User>,
  ) {
    const { profile, ...newParams } = params;

    const updatedUser = await this.user
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.profile', 'profiles')
      .where('users.id = :id', { id })
      .getOne();

    for (const key in updatedUser) {
      if (!newParams[key] && newParams.hasOwnProperty(key))
        newParams[key] = updatedUser[key];
    }

    if (newParams.username && newParams.username !== updatedUser.username) {
      if (await this.user.findOne({ username: newParams.username })) {
        throw new BadRequestException({
          message: 'username already exists',
        });
      }

      try {
        this.profile.manager.transaction(async (t) => {
          for await (const prof of updatedUser.profile) {
            let toBeUpdatedProf = prof.profile.split('/');
            await this.profile
              .createQueryBuilder()
              .update(Profile)
              .set({
                profile: `./files/${newParams.username}/profile/${
                  toBeUpdatedProf[toBeUpdatedProf.length - 1]
                }`,
              })
              .where('Id = :id', { id: prof.id })
              .execute();
          }
        });
        await fsExtra.move(
          `./files/${updatedUser.username}`,
          `./files/${newParams.username}`,
        );
      } catch (e) {
        throw new BadRequestException({ message: e });
      }
    }

    const { affected } = await this.user
      .createQueryBuilder()
      .update(User)
      .set({
        ...newParams,
      })
      .where('users.id = :id', { id })
      .execute();

    if (affected > 0) {
      return this.login(updatedUser);
    }

    throw new BadRequestException({
      message: 'update was unsuccessful',
    });
  }

  async changeProfilePic(
    id: string,
    fileValidationError: string,
    file: Express.Multer.File,
  ) {
    const updatedUser = await this.user
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.profile', 'profiles')
      .where('users.id = :id', { id })
      .getOne();

    if (fileValidationError && fileValidationError.length) {
      await this.removeFile(`./files/${updatedUser.username}/profile`);
      throw new BadRequestException({
        message: fileValidationError,
      });
    }

    const newProfile = this.profile.create({
      profile: `${file.destination}/${file.filename}`,
      date: new Date(),
    });

    newProfile.user = updatedUser;
    const profilePic = await this.profile.save(newProfile);

    if (!profilePic) {
      await this.removeFile(`./files/${updatedUser.username}/profile`);

      throw new BadRequestException({
        message: 'update was unsuccessful',
      });
    }
  }

  async changePassword(id: string, newPassword: string) {
    newPassword = await bcrypt.hash(newPassword, 10);

    const { affected } = await this.user
      .createQueryBuilder()
      .update(User)
      .set({
        password: newPassword,
      })
      .where('Id = :id', { id })
      .execute();

    if (affected !== 0) {
      const updatedUser = await this.user
        .createQueryBuilder('users')
        .leftJoinAndSelect('users.profile', 'profiles')
        .where('users.id = :id', { id })
        .getOne();

      return this.login(updatedUser);
    }

    throw new BadRequestException({ message: 'update unsuccessful' });
  }

  async deleteProfilePic(user: Partial<User>, filename: string) {
    const { affected } = await this.profile
      .createQueryBuilder('profiles')
      .delete()
      .from(Profile)
      .where('profile = :profile', { profile: filename })
      .andWhere('userId = :id', { id: user.id })
      .execute();

    if (affected !== 0) {
      try {
        await this.removeFile(filename);
      } catch (e) {
        throw new BadRequestException({
          message: 'could not delete profile picture',
        });
      }
      return { message: 'deleted profile pic successfully' };
    }

    throw new BadRequestException({
      message: 'could not delete profile picture',
    });
  }

  async delete(id: string) {
    const user = await this.user.findOne(id);

    const { affected } = await this.profile
      .createQueryBuilder('profiles')
      .delete()
      .from(Profile)
      .where('userId = :id', { id: user.id })
      .execute();

    if (affected > 0) {
      const res = await this.user.delete(id);
      if (res.affected && res.affected > 0) {
        await this.removeFile(`./files/${user.username}`);
        return user;
      }
    }

    throw new NotFoundException({
      message: 'user not found',
    });
  }
}
