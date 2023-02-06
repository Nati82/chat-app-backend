import {
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
  
  @Injectable()
  export class JwtAuthSocketGuard extends AuthGuard('jwtSocket') {
    canActivate(context: ExecutionContext) {
      // Add your custom authentication logic here
      // for example, call super.logIn(request) to establish a session.
      context.switchToWs();
      const auth = context.getArgs()[0].handshake.auth;
    context.getArgs()[0].authorization = auth.authorization;
    
      return super.canActivate(context);
    }
  
    handleRequest(err, user, info) {
      // You can throw an exception based on either "info" or "err" arguments
      console.log('user is', user)
      console.log('info is', info)  
      if (err || !user) {
        throw err || new UnauthorizedException();
      }
      return user;
    }
  }