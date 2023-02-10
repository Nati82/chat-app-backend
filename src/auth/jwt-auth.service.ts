import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';
import { User } from './entities/User.Entity';

@Injectable()
export class JwtAuthService {
  constructor(
    private authService: AuthService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const Result = await this.authService.findOne(username);
    console.log('password', password, 'result.password', Result.password);
    const bcryptResult = bcrypt.compare(password, Result.password).then(res => console.log('res', res));
    console.log('here again', await bcryptResult)
    if (Result && bcryptResult) {
      return Result;
    }
    return null;
  }
}
