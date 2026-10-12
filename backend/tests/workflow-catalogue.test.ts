import { RequestMethod } from "@nestjs/common";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { WorkflowsController } from "../src/workflows/workflows.controller.js";
import { WorkflowCatalogueService } from "../src/workflows/workflow-catalogue.service.js";

describe("workflow catalogue", () => {
  it("maps the public catalogue to GET /workflows", () => {
    expect(Reflect.getMetadata(PATH_METADATA, WorkflowsController)).toBe("workflows");
    expect(
      Reflect.getMetadata(METHOD_METADATA, WorkflowsController.prototype.listWorkflows),
    ).toBe(RequestMethod.GET);
  });

  it("exposes four fresh public definitions without simulation scripts", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [WorkflowsController],
      providers: [WorkflowCatalogueService],
    }).compile();
    const controller = moduleRef.get(WorkflowsController);

    const first = controller.listWorkflows();
    const second = controller.listWorkflows();

    expect(first).toHaveLength(4);
    expect(first).not.toBe(second);
    expect(first[0]).not.toBe(second[0]);
    expect(first).toEqual(second);
    expect(first.every((workflow) => !("simulation" in workflow))).toBe(true);

    const mutable = first as unknown as Array<{ name: string }>;
    mutable[0]!.name = "Consumer mutation";
    expect(controller.listWorkflows()[0]?.name).not.toBe("Consumer mutation");
  });
});
