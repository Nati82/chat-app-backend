import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return 'Welcome find the APIs at -> http://localhost:4000/api#/';
  }
}
