import { Module } from "@nestjs/common";

import { AppController } from "./app.controller.js";
import { WorkflowCatalogueService } from "./workflows/workflow-catalogue.service.js";
import { WorkflowsController } from "./workflows/workflows.controller.js";

@Module({
  controllers: [AppController, WorkflowsController],
  providers: [WorkflowCatalogueService],
})
export class AppModule {}
