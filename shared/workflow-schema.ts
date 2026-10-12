import type {
  JsonValue,
  RequestContext,
  RequestSubject,
  StepDefinition,
  WorkflowDefinition,
} from "./types.js";

export class ContractValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractValidationError";
  }
}

function fail(path: string, expectation: string): never {
  throw new ContractValidationError(`${path}: ${expectation}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail(path, "expected an object");
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    return fail(path, "expected a non-empty string");
  }
  return value;
}

function stableId(value: unknown, path: string): string {
  const parsed = string(value, path);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parsed)) {
    return fail(path, "expected a lowercase kebab-case stable ID");
  }
  return parsed;
}

function stringArray(value: unknown, path: string): readonly string[] {
  if (!Array.isArray(value) || value.length === 0) {
    return fail(path, "expected a non-empty array");
  }
  return value.map((item, index) => string(item, `${path}[${index}]`));
}

function jsonValue(value: unknown, path: string): JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => jsonValue(item, `${path}[${index}]`));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        jsonValue(item, `${path}.${key}`),
      ]),
    );
  }
  return fail(path, "expected a JSON-safe value");
}

function optionalString(
  source: Record<string, unknown>,
  key: string,
  path: string,
): string | undefined {
  return source[key] === undefined ? undefined : string(source[key], `${path}.${key}`);
}

function parseSubject(value: unknown, path: string): RequestSubject {
  const source = record(value, path);
  const role = optionalString(source, "role", path);
  const department = optionalString(source, "department", path);
  const manager = optionalString(source, "manager", path);

  return {
    id: stableId(source.id, `${path}.id`),
    name: string(source.name, `${path}.name`),
    initials: string(source.initials, `${path}.initials`),
    ...(role === undefined ? {} : { role }),
    ...(department === undefined ? {} : { department }),
    ...(manager === undefined ? {} : { manager }),
  };
}

function parseRequest(value: unknown, path: string): RequestContext {
  const source = record(value, path);
  const priority = source.priority;
  if (priority !== "normal" && priority !== "high") {
    return fail(`${path}.priority`, 'expected "normal" or "high"');
  }

  const details = record(source.details, `${path}.details`);
  return {
    subject: parseSubject(source.subject, `${path}.subject`),
    source: string(source.source, `${path}.source`),
    priority,
    details: Object.fromEntries(
      Object.entries(details).map(([key, detail]) => [
        key,
        jsonValue(detail, `${path}.details.${key}`),
      ]),
    ),
  };
}

function parseStep(value: unknown, path: string): StepDefinition {
  const source = record(value, path);
  return {
    id: stableId(source.id, `${path}.id`),
    name: string(source.name, `${path}.name`),
    description: string(source.description, `${path}.description`),
    systemId: stableId(source.systemId, `${path}.systemId`),
    actionLabel: string(source.actionLabel, `${path}.actionLabel`),
  };
}

export function parseWorkflowDefinition(
  value: unknown,
  path = "workflow",
): WorkflowDefinition {
  const source = record(value, path);
  const scenario = source.expectedScenario;
  if (scenario !== "success" && scenario !== "failure") {
    return fail(`${path}.expectedScenario`, 'expected "success" or "failure"');
  }

  if (!Array.isArray(source.steps) || source.steps.length === 0) {
    return fail(`${path}.steps`, "expected a non-empty array");
  }
  const steps = source.steps.map((step, index) => parseStep(step, `${path}.steps[${index}]`));
  const stepIds = new Set<string>();
  for (const step of steps) {
    if (stepIds.has(step.id)) {
      return fail(`${path}.steps`, `duplicate step id "${step.id}"`);
    }
    stepIds.add(step.id);
  }

  const systemIds = stringArray(source.systemIds, `${path}.systemIds`).map((id, index) =>
    stableId(id, `${path}.systemIds[${index}]`),
  );
  if (new Set(systemIds).size !== systemIds.length) {
    return fail(`${path}.systemIds`, "expected unique stable IDs");
  }
  for (const step of steps) {
    if (!systemIds.includes(step.systemId)) {
      return fail(
        `${path}.steps`,
        `step "${step.id}" references systemId "${step.systemId}" absent from systemIds`,
      );
    }
  }

  return {
    id: stableId(source.id, `${path}.id`),
    name: string(source.name, `${path}.name`),
    description: string(source.description, `${path}.description`),
    category: string(source.category, `${path}.category`),
    triggerDescription: string(source.triggerDescription, `${path}.triggerDescription`),
    systemIds,
    expectedScenario: scenario,
    request: parseRequest(source.request, `${path}.request`),
    steps,
  };
}

export function parseWorkflowDefinitions(value: unknown): readonly WorkflowDefinition[] {
  if (!Array.isArray(value)) {
    return fail("workflows", "expected an array");
  }
  const definitions = value.map((item, index) =>
    parseWorkflowDefinition(item, `workflows[${index}]`),
  );
  const ids = new Set<string>();
  for (const definition of definitions) {
    if (ids.has(definition.id)) {
      return fail("workflows", `duplicate workflow id "${definition.id}"`);
    }
    ids.add(definition.id);
  }
  return definitions;
}
