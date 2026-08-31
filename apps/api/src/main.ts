import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import cookieParser from "cookie-parser";
import * as https from "https";
import * as http from "http";
import express from "express";
import { ExpressAdapter } from "@nestjs/platform-express";
import compression from "compression";
import { envSchema } from "@scholarsome/shared";
import * as fs from "fs";
import { LoggerFactory } from "./app/shared/logger.factory";
import { createApiDocument } from "./app/shared/api-document";
import helmet from "helmet";
import { missingSitemapMiddleware } from "./app/providers/missing-sitemap.middleware";
import { noIndexMiddleware } from "./app/providers/no-index.middleware";

async function bootstrap() {
  const validation = envSchema
      .prefs({ errors: { label: "key" } })
      .validate(process.env);

  if (validation.error) {
    console.error(
        "\x1b[31m" + "Configuration validation error: " + validation.error.message
    );
    process.exit(1);
  }

  const server = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    bufferLogs: process.env.NODE_ENV !== "development"
  });

  app.enableCors();

  /**
   * unsafe-inline is required in style-src for Angular to work
   *
   * but unsafe-eval is required because i'm unable to find the module that is using it
   * in a future update, it will be removed
   */
  if (
    process.env.SSL_KEY_BASE64 &&
    process.env.SSL_KEY_BASE64.length > 0 &&
    process.env.SSL_CERT_BASE64 &&
    process.env.SSL_CERT_BASE64.length > 0
  ) {
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'", "'unsafe-eval'", "'unsafe-inline'", "blob:", "https://www.gstatic.com", "https://www.google.com", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://ssl.google-analytics.com"],
          "img-src": ["'self'", "blob:", "data:", "https://cdn.redoc.ly", "https://www.google-analytics.com"],
          "script-src-attr": ["'unsafe-inline'"],
          "default-src": ["'self'", "https://api.github.com", "https://google-analytics.com"],
          "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com/"],
          "connect-src": ["'self'", "https://www.google-analytics.com", "https://api.github.com"]
        }
      }
    }));
  } else {
    app.use(helmet({
      contentSecurityPolicy: false
    }));
  }

  const logger = LoggerFactory("Scholarsome");
  app.useLogger(logger);

  app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        disableErrorMessages: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "public"
      })
  );

  app.setGlobalPrefix("api", { exclude: ["assets/images/{*path}"] });

  app.use(cookieParser());
  app.use(compression());

  /**
   * JSON bodies can carry base64 images pasted into the card editor,
   * so they are given more headroom than form-encoded bodies
   */
  app.use(express.json({ limit: "30mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  // these middleware functions need to run before the serve static module,
  // therefore they are functional middleware instead of being class-based
  app.use(missingSitemapMiddleware);
  app.use(noIndexMiddleware);

  if (
    process.env.SSL_KEY_BASE64 &&
    process.env.SSL_KEY_BASE64.length > 0 &&
    process.env.SSL_CERT_BASE64 &&
    process.env.SSL_CERT_BASE64.length > 0
  ) {
    https
        .createServer(
            {
              key: Buffer.from(process.env.SSL_KEY_BASE64, "base64").toString(),
              cert: Buffer.from(process.env.SSL_CERT_BASE64, "base64").toString()
            },
            server
        )
        .listen(8443);
  }

  const document = createApiDocument(app);
  fs.writeFileSync("./dist/api-spec.json", JSON.stringify(document));

  await app.init();

  http.createServer(server).listen(process.env.HTTP_PORT);

  logger.log("Scholarsome has started!");
}

bootstrap();
