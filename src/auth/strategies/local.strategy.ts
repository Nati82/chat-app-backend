import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import {
  ClassSerializerInterceptor,
  Injectable,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthService } from '../jwt-auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private jwtAuthService: JwtAuthService) {
    super();
  }

  @UseInterceptors(ClassSerializerInterceptor)
  async validate(username: string, password: string) {
    const user = await this.jwtAuthService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
