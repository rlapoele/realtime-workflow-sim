import { Module } from "@nestjs/common";

import { AppController } from "./app.controller.js";
import { ExecutionsController } from "./executions/executions.controller.js";
import {
  defaultExecutionLimits,
  EXECUTION_LIMITS,
  EXECUTION_RUNTIME,
  ExecutionService,
  systemExecutionRuntime,
} from "./executions/execution.service.js";
import { WorkflowCatalogueService } from "./workflows/workflow-catalogue.service.js";
import { WorkflowsController } from "./workflows/workflows.controller.js";

@Module({
  controllers: [AppController, WorkflowsController, ExecutionsController],
  providers: [
    WorkflowCatalogueService,
    ExecutionService,
    { provide: EXECUTION_RUNTIME, useValue: systemExecutionRuntime },
    { provide: EXECUTION_LIMITS, useValue: defaultExecutionLimits },
  ],
})
export class AppModule {}
