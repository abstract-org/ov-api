import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
const DEFAULT_APP_PORT = 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(new ValidationPipe());
  const APP_PORT = configService.get<number>('APP_PORT') || DEFAULT_APP_PORT;
  const docsConfig = new DocumentBuilder()
    .setTitle('OpenValue API')
    .setDescription(
      'RESTful API using OpenValue SDK Modules to create Quests, Pools and Positions',
    )
    .setVersion('1.0')
    // .addTag('OpenValue API')
    .build();
  const document = SwaggerModule.createDocument(app, docsConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(APP_PORT);
}

bootstrap();
