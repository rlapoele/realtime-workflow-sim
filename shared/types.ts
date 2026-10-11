export type JsonPrimitive = boolean | number | string | null;

export type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

export type ExecutionStatus = "pending" | "running" | "success" | "failed";

export type StepStatus = "pending" | "running" | "success" | "failed" | "skipped";

export type ExpectedScenario = "success" | "failure";

export interface StepDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly systemId: string;
  readonly actionLabel: string;
}

export interface RequestSubject {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly role?: string;
  readonly department?: string;
  readonly manager?: string;
}

export interface RequestContext {
  readonly subject: RequestSubject;
  readonly source: string;
  readonly priority: "normal" | "high";
  readonly details: Readonly<Record<string, JsonValue>>;
}

export interface WorkflowDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly triggerDescription: string;
  readonly systemIds: readonly string[];
  readonly expectedScenario: ExpectedScenario;
  readonly request: RequestContext;
  readonly steps: readonly StepDefinition[];
}

export interface StepExecution {
  readonly stepId: string;
  readonly status: StepStatus;
  readonly logs: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly resultSummary?: string;
  readonly failureReason?: string;
}

export interface WorkflowExecution {
  readonly id: string;
  readonly workflowId: string;
  readonly request: RequestContext;
  readonly status: ExecutionStatus;
  readonly steps: readonly StepExecution[];
  readonly latestSequence: number;
  readonly createdAt: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly failureReason?: string;
}

interface SequencedExecutionEvent {
  readonly executionId: string;
  readonly sequence: number;
  readonly occurredAt: string;
}

export type ExecutionEvent =
  | (SequencedExecutionEvent & {
      readonly type: "execution.snapshot";
      readonly execution: WorkflowExecution;
    })
  | (SequencedExecutionEvent & {
      readonly type: "execution.status";
      readonly status: ExecutionStatus;
      readonly completedAt?: string;
      readonly failureReason?: string;
    })
  | (SequencedExecutionEvent & {
      readonly type: "step.status";
      readonly stepId: string;
      readonly status: StepStatus;
      readonly startedAt?: string;
      readonly completedAt?: string;
      readonly resultSummary?: string;
      readonly failureReason?: string;
    })
  | (SequencedExecutionEvent & {
      readonly type: "log.delta";
      readonly stepId: string;
      readonly delta: string;
    })
  | {
      readonly type: "heartbeat";
      readonly executionId: string;
      readonly occurredAt: string;
    };

export interface ApiError {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: Readonly<Record<string, JsonValue>>;
  };
}

export interface HealthResponse {
  readonly service: "agentflow-backend";
  readonly status: "ok";
}
