import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { WorkflowDefinition, WorkflowExecution } from "../../shared/types";
import { ExecutionConsole } from "../src/components/ExecutionConsole";

const workflow = {
  id: "employee-onboarding",
  name: "Employee onboarding",
  description: "Prepare a fictional new starter.",
  category: "Employee lifecycle",
  triggerDescription: "Simulated HRIS start-date event",
  systemIds: ["hris"],
  expectedScenario: "success",
  request: {
    subject: {
      id: "person-alex-chen",
      name: "Alex Chen",
      initials: "AC",
      role: "Frontend Engineer",
      department: "Engineering",
    },
    source: "HRIS event (simulated)",
    priority: "normal",
    details: { startDate: "2026-11-03" },
  },
  steps: [
    {
      id: "load-requirements",
      name: "Load requirements",
      description: "Load the standard starter profile.",
      systemId: "hris",
      actionLabel: "Load profile",
    },
  ],
} satisfies WorkflowDefinition;

const execution = {
  id: "execution-with-a-very-long-identifier-that-must-stay-contained",
  workflowId: workflow.id,
  request: workflow.request,
  status: "running",
  steps: [
    {
      stepId: "load-requirements",
      status: "running",
      logs: "Loaded fictional requirements.\nPreparing the next simulated action.",
      startedAt: "2026-10-13T08:00:00.000Z",
    },
  ],
  latestSequence: 3,
  createdAt: "2026-10-13T08:00:00.000Z",
  startedAt: "2026-10-13T08:00:00.000Z",
} satisfies WorkflowExecution;

function setScrollGeometry(
  element: HTMLElement,
  geometry: { clientHeight: number; scrollHeight: number; scrollTop: number },
) {
  Object.defineProperties(element, {
    clientHeight: { configurable: true, value: geometry.clientHeight },
    scrollHeight: { configurable: true, value: geometry.scrollHeight },
    scrollTop: { configurable: true, writable: true, value: geometry.scrollTop },
  });
}

describe("ExecutionConsole", () => {
  it("keeps new logs in view while the reader remains near the bottom", () => {
    const { rerender } = render(<ExecutionConsole execution={execution} workflow={workflow} />);
    const output = screen.getByRole("region", { name: "Execution log output" });
    setScrollGeometry(output, { clientHeight: 200, scrollHeight: 1_000, scrollTop: 790 });
    fireEvent.scroll(output);

    rerender(
      <ExecutionConsole
        execution={{
          ...execution,
          latestSequence: 4,
          steps: [
            {
              ...execution.steps[0]!,
              logs: `${execution.steps[0]!.logs}\nDone.`,
            },
          ],
        }}
        workflow={workflow}
      />,
    );

    expect(output.scrollTop).toBe(1_000);
    expect(screen.queryByRole("button", { name: "Jump to latest log" })).not.toBeInTheDocument();
  });

  it("pauses following after upward scrolling and resumes from Jump to latest", () => {
    const { rerender } = render(<ExecutionConsole execution={execution} workflow={workflow} />);
    const output = screen.getByRole("region", { name: "Execution log output" });
    setScrollGeometry(output, { clientHeight: 200, scrollHeight: 1_000, scrollTop: 300 });
    fireEvent.scroll(output);

    expect(screen.getByText("Live follow paused")).toBeVisible();
    const jumpButton = screen.getByRole("button", { name: "Jump to latest log" });

    rerender(
      <ExecutionConsole
        execution={{
          ...execution,
          latestSequence: 4,
          steps: [
            {
              ...execution.steps[0]!,
              logs: `${execution.steps[0]!.logs}\nDone.`,
            },
          ],
        }}
        workflow={workflow}
      />,
    );

    expect(output.scrollTop).toBe(300);
    fireEvent.click(jumpButton);
    expect(output.scrollTop).toBe(1_000);
    expect(screen.queryByText("Live follow paused")).not.toBeInTheDocument();
  });

  it("keeps log chunks out of live regions while exposing a keyboard-scrollable named region", () => {
    render(<ExecutionConsole execution={execution} workflow={workflow} />);

    const output = screen.getByRole("region", { name: "Execution log output" });
    expect(output).toHaveAttribute("tabindex", "0");
    expect(output).not.toHaveAttribute("aria-live");
    expect(screen.getByText(/Loaded fictional requirements/)).toBeVisible();
  });

  it("resumes following when a new execution replaces a paused run", async () => {
    const { rerender } = render(<ExecutionConsole execution={execution} workflow={workflow} />);
    const output = screen.getByRole("region", { name: "Execution log output" });
    setScrollGeometry(output, { clientHeight: 200, scrollHeight: 1_000, scrollTop: 300 });
    fireEvent.scroll(output);
    expect(screen.getByText("Live follow paused")).toBeVisible();

    rerender(
      <ExecutionConsole
        execution={{ ...execution, id: "execution-2", latestSequence: 0 }}
        workflow={workflow}
      />,
    );

    await waitFor(() => expect(screen.queryByText("Live follow paused")).not.toBeInTheDocument());
    expect(output.scrollTop).toBe(1_000);
  });
});
