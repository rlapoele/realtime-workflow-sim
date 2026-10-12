import { Controller, Get, Inject } from "@nestjs/common";

import type { WorkflowDefinition } from "../../../shared/types.js";
import { WorkflowCatalogueService } from "./workflow-catalogue.service.js";

@Controller("workflows")
export class WorkflowsController {
  constructor(
    @Inject(WorkflowCatalogueService)
    private readonly catalogue: WorkflowCatalogueService,
  ) {}

  @Get()
  listWorkflows(): readonly WorkflowDefinition[] {
    return this.catalogue.listDefinitions();
  }
}
