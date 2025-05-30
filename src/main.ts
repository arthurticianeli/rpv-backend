import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:3000', // ou '*', mas prefira ser específico
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true, // se usar cookies ou headers de auth
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
}
bootstrap();
