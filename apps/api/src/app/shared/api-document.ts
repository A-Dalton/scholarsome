import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

/**
 * Creates the OpenAPI document describing the Scholarsome API.
 *
 * Shared between main.ts, which regenerates the spec at every API startup,
 * and api-spec.ts, which generates it at build time so that the handbook can
 * include the API reference page without having to run the API first.
 */
export function createApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
      .setTitle("Scholarsome API")
      .setVersion("")
      .setDescription("This page contains documentation about how to use the Scholarsome API. Currently, only endpoints that do not require authentication are able to be used. In a future update, API tokens will be introduced that allow for the usage of privileged endpoints.")
      .build();

  return SwaggerModule.createDocument(app, config);
}
