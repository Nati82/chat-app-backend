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
    const bcryptResult = await bcrypt.compare(password, Result.password);
    
    if (Result && bcryptResult) {
      return Result;
    }
    
    return null;
  }
}
