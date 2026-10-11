import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardApp } from "../src/components/DashboardApp";

describe("DashboardApp", () => {
  it("shows backend health without implying workflow behavior", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ service: "agentflow-backend", status: "ok" }),
          { headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    render(<DashboardApp apiUrl="http://localhost:3000" />);

    expect(screen.getByRole("heading", { name: "Workflow executions" })).toBeVisible();
    expect(await screen.findByText("Backend available")).toBeVisible();
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/health");
  });
});
