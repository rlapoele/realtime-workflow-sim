import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";
import { resolveBackendConfig } from "./config.js";

async function bootstrap(): Promise<void> {
  const config = resolveBackendConfig(process.env);
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: config.frontendOrigin });
  app.enableShutdownHooks();

  await app.listen(config.port, "0.0.0.0");
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(`Backend startup failed: ${message}`);
  process.exitCode = 1;
});
