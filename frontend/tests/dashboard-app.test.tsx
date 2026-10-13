import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DashboardApp } from "../src/components/DashboardApp";

describe("DashboardApp", () => {
  it("shows the simulation shell and does not expose a run without a workflow", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } }),
      ),
    );

    render(<DashboardApp apiUrl="http://localhost:3000" />);

    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getByRole("heading", { name: "Workflow executions" })).toBeVisible();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(await screen.findByText("No workflows are available.")).toBeVisible();
    expect(screen.queryByRole("button", { name: /run workflow/i })).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/workflows");
  });
});
