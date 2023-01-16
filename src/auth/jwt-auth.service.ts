import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from './entities/User.Entity';

@Injectable()
export class JwtAuthService {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const Result = await this.authService.findOne(username);

    if (Result && bcrypt.compare(Result.password, password)) {
      return Result;
    }
    return null;
  }
}
