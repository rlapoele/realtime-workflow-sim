import { readFileSync, readdirSync } from "node:fs";

import type { WorkflowDefinition } from "../../../shared/types.js";
import {
  ContractValidationError,
  parseWorkflowDefinition,
} from "../../../shared/workflow-schema.js";

export const MAX_STEP_DURATION_MS = 60_000;

export interface SimulationStep {
  readonly stepId: string;
  readonly durationMs: number;
  readonly logs: readonly string[];
  readonly outcome: "success" | "failed";
  readonly resultSummary?: string;
  readonly failureReason?: string;
}

export interface WorkflowSeed {
  readonly schemaVersion: 1;
  readonly definition: WorkflowDefinition;
  readonly simulation: {
    readonly steps: readonly SimulationStep[];
  };
}

export interface WorkflowSeedDocument {
  readonly filename: string;
  readonly value: unknown;
}

const DEFAULT_SEED_DIRECTORY = new URL("../../seeds/workflows/", import.meta.url);

function fail(filename: string, detail: string): never {
  throw new Error(`Invalid workflow seed ${filename}: ${detail}`);
}

function record(value: unknown, filename: string, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail(filename, `${path}: expected an object`);
  }
  return value as Record<string, unknown>;
}

function nonEmptyString(value: unknown, filename: string, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    return fail(filename, `${path}: expected a non-empty string`);
  }
  return value;
}

function parseSimulationStep(
  value: unknown,
  filename: string,
  index: number,
): SimulationStep {
  const path = `simulation.steps[${index}]`;
  const source = record(value, filename, path);
  const durationMs = source.durationMs;
  if (
    typeof durationMs !== "number" ||
    !Number.isInteger(durationMs) ||
    durationMs < 1 ||
    durationMs > MAX_STEP_DURATION_MS
  ) {
    return fail(
      filename,
      `${path}.durationMs: expected an integer from 1 to ${MAX_STEP_DURATION_MS}`,
    );
  }
  if (!Array.isArray(source.logs) || source.logs.length === 0) {
    return fail(filename, `${path}.logs: expected a non-empty array`);
  }
  const logs = source.logs.map((log, logIndex) =>
    nonEmptyString(log, filename, `${path}.logs[${logIndex}]`),
  );
  if (source.outcome !== "success" && source.outcome !== "failed") {
    return fail(filename, `${path}.outcome: expected "success" or "failed"`);
  }
  const resultSummary =
    source.resultSummary === undefined
      ? undefined
      : nonEmptyString(source.resultSummary, filename, `${path}.resultSummary`);
  const failureReason =
    source.failureReason === undefined
      ? undefined
      : nonEmptyString(source.failureReason, filename, `${path}.failureReason`);
  if (source.outcome === "failed" && failureReason === undefined) {
    return fail(filename, `${path}.failureReason: required when outcome is failed`);
  }

  return {
    stepId: nonEmptyString(source.stepId, filename, `${path}.stepId`),
    durationMs,
    logs,
    outcome: source.outcome,
    ...(resultSummary === undefined ? {} : { resultSummary }),
    ...(failureReason === undefined ? {} : { failureReason }),
  };
}

function parseSeed(document: WorkflowSeedDocument): WorkflowSeed {
  const source = record(document.value, document.filename, "seed");
  if (source.schemaVersion !== 1) {
    return fail(document.filename, "schemaVersion: only version 1 is supported");
  }

  let definition: WorkflowDefinition;
  try {
    definition = parseWorkflowDefinition(source.definition, "definition");
  } catch (error) {
    if (error instanceof ContractValidationError) {
      return fail(document.filename, error.message);
    }
    throw error;
  }

  const simulation = record(source.simulation, document.filename, "simulation");
  if (!Array.isArray(simulation.steps) || simulation.steps.length === 0) {
    return fail(document.filename, "simulation.steps: expected a non-empty array");
  }
  const steps = simulation.steps.map((step, index) =>
    parseSimulationStep(step, document.filename, index),
  );
  const definitionIds = new Set(definition.steps.map((step) => step.id));
  const scriptIds = new Set<string>();
  for (const step of steps) {
    if (!definitionIds.has(step.stepId)) {
      return fail(
        document.filename,
        `simulation.steps: script references unknown step "${step.stepId}"`,
      );
    }
    if (scriptIds.has(step.stepId)) {
      return fail(
        document.filename,
        `simulation.steps: duplicate script entry for step "${step.stepId}"`,
      );
    }
    scriptIds.add(step.stepId);
  }
  const missingScript = definition.steps.find((step) => !scriptIds.has(step.id));
  if (missingScript !== undefined) {
    return fail(
      document.filename,
      `simulation.steps: missing script entry for definition step "${missingScript.id}"`,
    );
  }
  const failedSteps = steps.filter((step) => step.outcome === "failed");
  if (definition.expectedScenario === "success" && failedSteps.length !== 0) {
    return fail(
      document.filename,
      "definition.expectedScenario: success requires every script outcome to succeed",
    );
  }
  if (definition.expectedScenario === "failure" && failedSteps.length !== 1) {
    return fail(
      document.filename,
      "definition.expectedScenario: failure requires exactly one failed script outcome",
    );
  }

  return deepFreeze({
    schemaVersion: 1,
    definition,
    simulation: { steps },
  });
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

export function validateWorkflowSeedDocuments(
  documents: readonly WorkflowSeedDocument[],
): ReadonlyMap<string, WorkflowSeed> {
  const seeds = new Map<string, WorkflowSeed>();
  const filenamesById = new Map<string, string>();
  for (const document of documents) {
    const seed = parseSeed(document);
    const firstFilename = filenamesById.get(seed.definition.id);
    if (firstFilename !== undefined) {
      return fail(
        document.filename,
        `duplicate workflow id "${seed.definition.id}"; already defined in ${firstFilename}`,
      );
    }
    seeds.set(seed.definition.id, seed);
    filenamesById.set(seed.definition.id, document.filename);
  }
  return seeds;
}

export function loadWorkflowSeeds(
  directory: URL = DEFAULT_SEED_DIRECTORY,
): ReadonlyMap<string, WorkflowSeed> {
  const filenames = readdirSync(directory)
    .filter((filename) => filename.endsWith(".json"))
    .sort();
  const documents = filenames.map((filename) => {
    let value: unknown;
    try {
      value = JSON.parse(readFileSync(new URL(filename, directory), "utf8"));
    } catch (error) {
      const detail = error instanceof Error ? error.message : "unable to read JSON";
      return fail(filename, `JSON parse failed: ${detail}`);
    }
    return { filename, value };
  });
  return validateWorkflowSeedDocuments(documents);
}
