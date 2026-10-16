import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  type MessageEvent,
  Param,
  Post,
  Query,
  Sse,
  UseGuards,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs";

import type { WorkflowDefinition, WorkflowExecution } from "../../../shared/types.js";
import {
  ExecutionCapacityError,
  ExecutionService,
} from "../executions/execution.service.js";
import { notFound, tooManyRequests } from "../http-errors.js";
import { TriggerThrottlerGuard } from "./trigger-throttler.guard.js";
import { WorkflowCatalogueService } from "./workflow-catalogue.service.js";

@Controller("workflows")
export class WorkflowsController {
  constructor(
    @Inject(WorkflowCatalogueService)
    private readonly catalogue: WorkflowCatalogueService,
    @Inject(ExecutionService)
    private readonly executions: ExecutionService,
  ) {}

  @Get()
  listWorkflows(): readonly WorkflowDefinition[] {
    return this.catalogue.listDefinitions();
  }

  @Sse("stream")
  streamExecution(@Query("executionId") executionId: string): Observable<MessageEvent> {
    const stream = this.executions.stream(executionId);
    if (stream === undefined) {
      throw notFound(`Execution "${executionId}" was not found.`);
    }
    return stream.pipe(
      map((event) => ({
        type: event.type,
        data: event,
        ...(event.type === "heartbeat" ? {} : { id: String(event.sequence) }),
      })),
    );
  }

  @Post(":workflowId/trigger")
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(TriggerThrottlerGuard)
  triggerWorkflow(@Param("workflowId") workflowId: string): WorkflowExecution {
    let execution: WorkflowExecution | undefined;
    try {
      execution = this.executions.trigger(workflowId);
    } catch (error) {
      if (error instanceof ExecutionCapacityError) {
        throw tooManyRequests(
          "The demo is handling the maximum number of active executions. Try again after a run completes.",
        );
      }
      throw error;
    }
    if (execution === undefined) {
      throw notFound(`Workflow "${workflowId}" was not found.`);
    }
    return execution;
  }
}
