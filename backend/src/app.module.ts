import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

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
import {
  TriggerThrottlerGuard,
  triggerThrottlers,
} from "./workflows/trigger-throttler.guard.js";
import { WorkflowsController } from "./workflows/workflows.controller.js";

@Module({
  imports: [ThrottlerModule.forRoot([...triggerThrottlers])],
  controllers: [AppController, WorkflowsController, ExecutionsController],
  providers: [
    WorkflowCatalogueService,
    ExecutionService,
    { provide: EXECUTION_RUNTIME, useValue: systemExecutionRuntime },
    { provide: EXECUTION_LIMITS, useValue: defaultExecutionLimits },
    TriggerThrottlerGuard,
  ],
})
export class AppModule {}
