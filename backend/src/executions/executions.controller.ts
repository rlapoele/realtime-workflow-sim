import { Controller, Get, Inject, Param } from "@nestjs/common";

import type { WorkflowExecution } from "../../../shared/types.js";
import { notFound } from "../http-errors.js";
import { ExecutionService } from "./execution.service.js";

@Controller("executions")
export class ExecutionsController {
  constructor(
    @Inject(ExecutionService)
    private readonly executions: ExecutionService,
  ) {}

  @Get(":executionId")
  getExecution(@Param("executionId") executionId: string): WorkflowExecution {
    const execution = this.executions.get(executionId);
    if (execution === undefined) {
      throw notFound(`Execution "${executionId}" was not found.`);
    }
    return execution;
  }
}
