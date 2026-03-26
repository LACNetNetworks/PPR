import { Logger,ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';


async function bootstrap() {
  const logger = new Logger('Bootstrap');  
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const prefix = configService.get<string>('GLOBAL_PREFIX') ?? 'ppr';

 app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
      res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');
      res.header('Access-Control-Allow-Credentials', 'true');
      return res.sendStatus(204);
    }
    next();
  });


  app.setGlobalPrefix(prefix);

  app.enableCors({
    origin: [
      "http://localhost:5173",
      "https://localhost:5173",             
      "https://trace4good.l-net.io",
      "http://trace4good.l-net.io",
      "https://dev-trace4good.l-net.io",
      "http://dev-trace4good.l-net.io",
      "https://stg-trace4good.l-net.io",
      "http://stg-trace4good.l-net.io",
      "https://ppr-frontend-next.l-net.io",
      "http://ppr-frontend-next.l-net.io",
      "https://blockchain4impact.l-net.io",
      "http://blockchain4impact.l-net.io",
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',    
    allowedHeaders: '*',
    credentials: true, // Include credentials if needed
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const nodeEnv = configService.get<string>('app.env');

  const isProd = nodeEnv === 'production';

    const config = new DocumentBuilder()
        .setTitle('PPR API')
        .setDescription('API de PPR, fondos, proveedores de servicio y evidencias')
        .setVersion('1.0.1')
        .addBearerAuth(
        {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Access Token emitido por Keycloak',
        },
        'keycloak'
        )
        .build();

    const document = SwaggerModule.createDocument(app, config, {
        deepScanRoutes: true,
    });


    SwaggerModule.setup('docs', app, document, {
      useGlobalPrefix: true,
      jsonDocumentUrl: 'openapi.json',
      swaggerOptions: {
       persistAuthorization: true,
       tagsSorter: 'alpha',
       operationsSorter: 'alpha',
      },
      customSiteTitle: 'PPR API Docs',
    });
  

  const port = configService.get<number>('PORT') ?? 3000;

  await app.listen(port || 3000, '0.0.0.0');

  const url = await app.getUrl(); 
  logger.log(`App listening on ${url}/${prefix}`);
  logger.log(`Swagger ${url}/${prefix}/docs`);
  logger.log(`Health ${url}/${prefix}/health`);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});