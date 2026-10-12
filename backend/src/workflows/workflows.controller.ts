import { Controller, Get, HttpCode, HttpStatus, Inject, Param, Post } from "@nestjs/common";

import type { WorkflowDefinition, WorkflowExecution } from "../../../shared/types.js";
import { ExecutionService } from "../executions/execution.service.js";
import { notFound } from "../http-errors.js";
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

  @Post(":workflowId/trigger")
  @HttpCode(HttpStatus.ACCEPTED)
  triggerWorkflow(@Param("workflowId") workflowId: string): WorkflowExecution {
    const execution = this.executions.trigger(workflowId);
    if (execution === undefined) {
      throw notFound(`Workflow "${workflowId}" was not found.`);
    }
    return execution;
  }
}
