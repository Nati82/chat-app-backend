import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { AsyncApiDocumentBuilder, AsyncApiModule } from 'nestjs-asyncapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Chat-app APIs')
    .setDescription('A simple chat app')
    .setVersion('1.0')
    .addTag('Chat-app')
    .addBearerAuth()
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };
  const document = SwaggerModule.createDocument(app, swaggerConfig, options);
  SwaggerModule.setup('api', app, document);

  const asyncApiOptions = new AsyncApiDocumentBuilder()
    .setTitle('Chat-app APIs')
    .setDescription('A simple chat app')
    .setVersion('1.0')
    .setDefaultContentType('application/json')
    // .addSecurity('user-password', { type: 'userPassword' })
    .addServer('chat-app-ws', {
      url: 'ws://localhost:4000/chat',
      protocol: 'socket.io',
    })
    .build();

  const asyncapiDocument = await AsyncApiModule.createDocument(
    app,
    asyncApiOptions,
  );
  await AsyncApiModule.setup('asyncApi', app, asyncapiDocument);

  app.enableCors({
    origin: '*',
    allowedHeaders: 'Content-Type, Authorization',
    methods: 'GET, POST, PATCH, DELETE, OPTIONS',
  });

  await app.listen(4000);
}
bootstrap();
