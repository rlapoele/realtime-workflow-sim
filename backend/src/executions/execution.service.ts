import { Inject, Injectable, type OnApplicationShutdown } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import type {
  ExecutionStatus,
  RequestContext,
  StepExecution,
  StepStatus,
  WorkflowExecution,
} from "../../../shared/types.js";
import { WorkflowCatalogueService } from "../workflows/workflow-catalogue.service.js";
import type { SimulationStep, WorkflowSeed } from "../workflows/workflow-seed-loader.js";

export interface ExecutionRuntime {
  readonly createId: () => string;
  readonly now: () => Date;
  readonly schedule: (callback: () => void, delayMs: number) => unknown;
  readonly cancel: (handle: unknown) => void;
}

export interface ExecutionLimits {
  readonly maxCompletedExecutions: number;
  readonly maxLogCharacters: number;
}

export const EXECUTION_RUNTIME = Symbol("EXECUTION_RUNTIME");
export const EXECUTION_LIMITS = Symbol("EXECUTION_LIMITS");

export const systemExecutionRuntime: ExecutionRuntime = {
  createId: () => randomUUID(),
  now: () => new Date(),
  schedule: (callback, delayMs) => setTimeout(callback, delayMs),
  cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export const defaultExecutionLimits: ExecutionLimits = {
  maxCompletedExecutions: 50,
  maxLogCharacters: 64_000,
};

interface MutableStepExecution {
  stepId: string;
  status: StepStatus;
  logs: string;
  startedAt?: string;
  completedAt?: string;
  resultSummary?: string;
  failureReason?: string;
}

interface MutableExecution {
  id: string;
  workflowId: string;
  request: RequestContext;
  status: ExecutionStatus;
  steps: MutableStepExecution[];
  latestSequence: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failureReason?: string;
  logCharacters: number;
}

@Injectable()
export class ExecutionService implements OnApplicationShutdown {
  private readonly executions = new Map<string, MutableExecution>();
  private readonly completedIds: string[] = [];
  private readonly pendingTimers = new Map<unknown, (completed: boolean) => void>();
  private stopped = false;

  constructor(
    @Inject(WorkflowCatalogueService)
    private readonly catalogue: WorkflowCatalogueService,
    @Inject(EXECUTION_RUNTIME)
    private readonly runtime: ExecutionRuntime,
    @Inject(EXECUTION_LIMITS)
    private readonly limits: ExecutionLimits,
  ) {}

  trigger(workflowId: string): WorkflowExecution | undefined {
    const seed = this.catalogue.getSeed(workflowId);
    if (seed === undefined) return undefined;

    const execution: MutableExecution = {
      id: this.runtime.createId(),
      workflowId,
      request: structuredClone(seed.definition.request),
      status: "pending",
      steps: seed.definition.steps.map((step) => ({
        stepId: step.id,
        status: "pending",
        logs: "",
      })),
      latestSequence: 0,
      createdAt: this.timestamp(),
      logCharacters: 0,
    };
    this.executions.set(execution.id, execution);
    void this.startWhenScheduled(execution, seed);
    return this.snapshot(execution);
  }

  get(executionId: string): WorkflowExecution | undefined {
    const execution = this.executions.get(executionId);
    return execution === undefined ? undefined : this.snapshot(execution);
  }

  onApplicationShutdown(): void {
    this.stopped = true;
    for (const [handle, resolve] of this.pendingTimers) {
      this.runtime.cancel(handle);
      resolve(false);
    }
    this.pendingTimers.clear();
  }

  private async startWhenScheduled(execution: MutableExecution, seed: WorkflowSeed): Promise<void> {
    if (!(await this.delay(0))) return;
    await this.run(execution, seed.simulation.steps);
  }

  private async run(
    execution: MutableExecution,
    script: readonly SimulationStep[],
  ): Promise<void> {
    execution.status = "running";
    execution.startedAt = this.timestamp();
    this.advanceSequence(execution);

    for (const instruction of script) {
      const step = execution.steps.find((item) => item.stepId === instruction.stepId);
      if (step === undefined) return;

      step.status = "running";
      step.startedAt = this.timestamp();
      this.advanceSequence(execution);

      const chunkDuration = instruction.durationMs / instruction.logs.length;
      for (const log of instruction.logs) {
        if (!(await this.delay(chunkDuration))) return;
        this.appendLog(execution, step, log);
        this.advanceSequence(execution);
      }

      step.completedAt = this.timestamp();
      if (instruction.outcome === "failed") {
        const failureReason = instruction.failureReason ?? "Simulation step failed.";
        step.status = "failed";
        step.failureReason = failureReason;
        execution.status = "failed";
        execution.failureReason = failureReason;
        execution.completedAt = this.timestamp();
        this.advanceSequence(execution);
        this.skipPendingSteps(execution);
        this.retainCompleted(execution.id);
        return;
      }

      step.status = "success";
      if (instruction.resultSummary !== undefined) {
        step.resultSummary = instruction.resultSummary;
      }
      this.advanceSequence(execution);
    }

    execution.status = "success";
    execution.completedAt = this.timestamp();
    this.advanceSequence(execution);
    this.retainCompleted(execution.id);
  }

  private skipPendingSteps(execution: MutableExecution): void {
    for (const step of execution.steps.filter((item) => item.status === "pending")) {
      step.status = "skipped";
      step.completedAt = this.timestamp();
      this.advanceSequence(execution);
    }
  }

  private appendLog(
    execution: MutableExecution,
    step: MutableStepExecution,
    log: string,
  ): void {
    const prefix = step.logs === "" ? "" : "\n";
    const remaining = this.limits.maxLogCharacters - execution.logCharacters;
    if (remaining <= 0) return;
    const addition = `${prefix}${log}`.slice(0, remaining);
    step.logs += addition;
    execution.logCharacters += addition.length;
  }

  private retainCompleted(executionId: string): void {
    this.completedIds.push(executionId);
    while (this.completedIds.length > this.limits.maxCompletedExecutions) {
      const oldestId = this.completedIds.shift();
      if (oldestId !== undefined) this.executions.delete(oldestId);
    }
  }

  private delay(delayMs: number): Promise<boolean> {
    if (this.stopped) return Promise.resolve(false);

    return new Promise((resolve) => {
      const handle = this.runtime.schedule(() => {
        this.pendingTimers.delete(handle);
        resolve(true);
      }, delayMs);
      this.pendingTimers.set(handle, resolve);
    });
  }

  private timestamp(): string {
    return this.runtime.now().toISOString();
  }

  private advanceSequence(execution: MutableExecution): void {
    execution.latestSequence += 1;
  }

  private snapshot(execution: MutableExecution): WorkflowExecution {
    const { logCharacters: _logCharacters, ...contract } = execution;
    return structuredClone({
      ...contract,
      steps: contract.steps as readonly StepExecution[],
    });
  }
}
