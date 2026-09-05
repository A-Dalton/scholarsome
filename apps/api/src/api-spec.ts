import { NestFactory } from "@nestjs/core";
import * as fs from "fs";
import { AppModule } from "./app/app.module";
import { createApiDocument } from "./app/shared/api-document";

/**
 * Writes the OpenAPI spec consumed by the handbook build (redocusaurus), so
 * that the /handbook/api/ page can be generated during image builds where no
 * database or Redis is available.
 *
 * The application is created but never initialized: Nest only instantiates
 * providers during create(), while lifecycle hooks such as database and Redis
 * connections run in init(), which this script deliberately skips. Route
 * metadata is already available at that point, which is exactly what
 * SwaggerModule needs. process.exit() is called explicitly afterwards to cut
 * any background connection retries started by third-party providers.
 */
async function generateApiSpec() {
  // Unlike a real boot, image builds run without a .env file or configured
  // environment. Providers that validate configuration in their constructors
  // would throw during create(), so supply harmless placeholders for the
  // values they read. Real values are never overwritten.
  process.env.JWT_SECRET ||= "spec-generation-placeholder";
  process.env.STORAGE_TYPE ||= "local";
  process.env.DATABASE_URL ||= "mysql://scholarsome:scholarsome@localhost:3306/scholarsome";

  try {
    const app = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false
    });

    const document = createApiDocument(app);
    fs.mkdirSync("./dist", { recursive: true });
    fs.writeFileSync("./dist/api-spec.json", JSON.stringify(document));

    console.log("OpenAPI spec written to dist/api-spec.json");
    process.exit(0);
  } catch (err) {
    console.error("Failed to generate the OpenAPI spec:", err);
    process.exit(1);
  }
}

void generateApiSpec();
