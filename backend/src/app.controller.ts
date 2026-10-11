import { Controller, Get } from "@nestjs/common";

import type { HealthResponse } from "../../shared/types.js";

@Controller()
export class AppController {
  @Get("health")
  getHealth(): HealthResponse {
    return {
      service: "agentflow-backend",
      status: "ok",
    };
  }
}
