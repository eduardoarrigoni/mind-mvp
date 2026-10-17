import { INestApplication, ValidationPipe } from '@nestjs/common';

/** Configuração HTTP compartilhada entre main.ts e os testes e2e. */
export function configurarApp(app: INestApplication): INestApplication {
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  return app;
}
