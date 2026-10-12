import { HttpException, HttpStatus, RequestMethod } from "@nestjs/common";
import {
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from "@nestjs/common/constants";
import { firstValueFrom, of } from "rxjs";
import { describe, expect, it } from "vitest";

import { ExecutionsController } from "../src/executions/executions.controller.js";
import { ExecutionService } from "../src/executions/execution.service.js";
import { WorkflowsController } from "../src/workflows/workflows.controller.js";

const execution = {
  id: "execution-1",
  workflowId: "employee-onboarding",
  request: {
    subject: { id: "person-alex", name: "Alex", initials: "AC" },
    source: "Simulation",
    priority: "normal" as const,
    details: {},
  },
  status: "pending" as const,
  steps: [],
  latestSequence: 0,
  createdAt: "2026-10-12T08:00:00.000Z",
};

function serviceStub() {
  return {
    trigger: (workflowId: string) =>
      workflowId === execution.workflowId ? structuredClone(execution) : undefined,
    get: (executionId: string) =>
      executionId === execution.id ? structuredClone(execution) : undefined,
    stream: (executionId: string) =>
      executionId === execution.id
        ? {
            pipe: () => "stream",
          }
        : undefined,
  } as ExecutionService;
}

describe("execution API", () => {
  it("maps the trigger to POST with an explicit 202 status", () => {
    expect(
      Reflect.getMetadata(METHOD_METADATA, WorkflowsController.prototype.triggerWorkflow),
    ).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(PATH_METADATA, WorkflowsController.prototype.triggerWorkflow)).toBe(
      ":workflowId/trigger",
    );
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, WorkflowsController.prototype.triggerWorkflow),
    ).toBe(HttpStatus.ACCEPTED);
  });

  it("maps execution lookup to GET /executions/:executionId", () => {
    expect(Reflect.getMetadata(PATH_METADATA, ExecutionsController)).toBe("executions");
    expect(Reflect.getMetadata(METHOD_METADATA, ExecutionsController.prototype.getExecution)).toBe(
      RequestMethod.GET,
    );
    expect(Reflect.getMetadata(PATH_METADATA, ExecutionsController.prototype.getExecution)).toBe(
      ":executionId",
    );
  });

  it("maps the execution stream to GET /workflows/stream", () => {
    expect(Reflect.getMetadata(METHOD_METADATA, WorkflowsController.prototype.streamExecution)).toBe(
      RequestMethod.GET,
    );
    expect(Reflect.getMetadata(PATH_METADATA, WorkflowsController.prototype.streamExecution)).toBe(
      "stream",
    );
  });

  it("serializes named SSE events with the execution sequence as the event ID", async () => {
    const event = {
      type: "log.delta" as const,
      executionId: execution.id,
      sequence: 4,
      occurredAt: "2026-10-12T08:00:01.000Z",
      stepId: "load-requirements",
      delta: "Loaded.",
    };
    const service = {
      ...serviceStub(),
      stream: () => of(event),
    } as unknown as ExecutionService;
    const controller = new WorkflowsController({ listDefinitions: () => [] } as never, service);

    await expect(firstValueFrom(controller.streamExecution(execution.id))).resolves.toEqual({
      type: "log.delta",
      id: "4",
      data: event,
    });
  });

  it("returns the shared 404 envelope before opening an unknown execution stream", () => {
    const controller = new WorkflowsController(
      { listDefinitions: () => [] } as never,
      serviceStub(),
    );

    expect(() => controller.streamExecution("missing")).toThrow(HttpException);
  });

  it("returns fresh trigger and lookup contracts", () => {
    const service = serviceStub();
    const workflows = new WorkflowsController({ listDefinitions: () => [] } as never, service);
    const executions = new ExecutionsController(service);

    expect(workflows.triggerWorkflow("employee-onboarding")).toEqual(execution);
    expect(executions.getExecution("execution-1")).toEqual(execution);
  });

  it.each([
    ["workflow", () => new WorkflowsController({ listDefinitions: () => [] } as never, serviceStub()).triggerWorkflow("missing")],
    ["execution", () => new ExecutionsController(serviceStub()).getExecution("missing")],
  ])("returns the shared 404 error envelope for a missing %s", (_label, invoke) => {
    try {
      invoke();
      throw new Error("Expected request to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const exception = error as HttpException;
      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(exception.getResponse()).toEqual({
        error: {
          code: "not_found",
          message: expect.any(String),
        },
      });
    }
  });
});
