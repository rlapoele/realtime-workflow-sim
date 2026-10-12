import { Injectable } from "@nestjs/common";

import type { WorkflowDefinition } from "../../../shared/types.js";
import { loadWorkflowSeeds } from "./workflow-seed-loader.js";

@Injectable()
export class WorkflowCatalogueService {
  private readonly seeds = loadWorkflowSeeds();

  listDefinitions(): readonly WorkflowDefinition[] {
    return [...this.seeds.values()].map((seed) => structuredClone(seed.definition));
  }
}
