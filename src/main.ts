import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe()
  );

  const config = new DocumentBuilder()
    .setTitle('Chat-app APIs')
    .setDescription('A simple chat app')
    .setVersion('1.0')
    .addTag('Chat-app')
    .addBearerAuth()
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };
  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    origin: '*',
    allowedHeaders: 'Content-Type, Authorization',
    methods: 'GET, POST, PATCH, DELETE, OPTIONS',
  });
  
  await app.listen(4000);
}
bootstrap();
