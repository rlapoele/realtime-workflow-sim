import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardApp } from "@/components/DashboardApp";

const workflows = [
  {
    id: "app-access",
    name: "Application access",
    description: "Review and simulate an application access request.",
    category: "IT access",
    triggerDescription: "Manual request from a simulated Slack channel",
    systemIds: ["request-intake", "identity"],
    expectedScenario: "failure",
    request: {
      subject: {
        id: "person-nora-martin",
        name: "Nora Martin",
        initials: "NM",
        role: "Product Designer",
        department: "Design",
        manager: "Camille Roux",
      },
      source: "Slack request (simulated)",
      priority: "normal",
      details: { application: "Figma", accessLevel: "Editor" },
    },
    steps: [
      {
        id: "qualify",
        name: "Qualify request",
        description: "Review the request context.",
        systemId: "request-intake",
        actionLabel: "Review context",
      },
      {
        id: "provision",
        name: "Provision access",
        description: "Simulate group assignment.",
        systemId: "identity",
        actionLabel: "Simulate provisioning",
      },
    ],
  },
  {
    id: "employee-onboarding",
    name: "Employee onboarding",
    description: "Prepare a fictional new starter.",
    category: "Employee lifecycle",
    triggerDescription: "Simulated HRIS start-date event",
    systemIds: ["request-intake", "device"],
    expectedScenario: "success",
    request: {
      subject: {
        id: "person-alex-chen",
        name: "Alex Chen",
        initials: "AC",
        role: "Frontend Engineer",
        department: "Engineering",
        manager: "Morgan Lee",
      },
      source: "HRIS event (simulated)",
      priority: "normal",
      details: { startDate: "2026-11-03", device: "Standard laptop" },
    },
    steps: [
      {
        id: "requirements",
        name: "Load requirements",
        description: "Load the standard starter profile.",
        systemId: "request-intake",
        actionLabel: "Load profile",
      },
    ],
  },
];

function mockApi(body: unknown, init: ResponseInit = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json" },
        ...init,
      }),
    ),
  );
}

describe("workflow catalogue", () => {
  it("renders API-authored request context and ordered pending steps", async () => {
    mockApi(workflows);
    render(<DashboardApp apiUrl="http://localhost:3000" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading workflows");
    expect(await screen.findByRole("heading", { name: "Application access" })).toBeVisible();
    expect(screen.getByText("Expected failure")).toBeVisible();
    expect(screen.getByText("Expected failure")).toHaveAttribute("data-slot", "badge");
    expect(screen.getByText("Nora Martin")).toBeVisible();
    expect(screen.getByText("Figma")).toBeVisible();

    const steps = screen.getByRole("list", { name: "Workflow steps" });
    expect(within(steps).getAllByText("Pending")).toHaveLength(2);
    expect(within(steps).getAllByRole("listitem")[0]).toHaveTextContent("Qualify request");
  });

  it("changes the displayed workflow through the Base UI select", async () => {
    mockApi(workflows);
    render(<DashboardApp apiUrl="http://localhost:3000" />);

    const trigger = await screen.findByRole("combobox", { name: "Workflow" });
    fireEvent.click(trigger);
    const option = await screen.findByRole("option", { name: "Employee onboarding" });
    fireEvent.pointerDown(option);
    fireEvent.pointerUp(option);
    fireEvent.click(option);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Employee onboarding" })).toBeVisible(),
    );
    expect(screen.getByText("Alex Chen")).toBeVisible();
    expect(screen.getByText("Expected success")).toBeVisible();
  });

  it("shows an empty catalogue state", async () => {
    mockApi([]);
    render(<DashboardApp apiUrl="http://localhost:3000" />);

    expect(await screen.findByText("No workflows are available.")).toBeVisible();
  });

  it("shows an actionable API error", async () => {
    mockApi({ error: { code: "catalogue_unavailable", message: "Unavailable" } }, { status: 503 });
    render(<DashboardApp apiUrl="http://localhost:3000" />);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Workflow catalogue unavailable.");
    expect(alert).toHaveAttribute("data-slot", "alert");
    expect(alert).toHaveTextContent("Check that the local API is running and try again.");
  });

  it("rejects malformed external workflow data", async () => {
    mockApi([{ ...workflows[0], steps: [] }]);
    render(<DashboardApp apiUrl="http://localhost:3000" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Workflow catalogue unavailable");
  });
});
