import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

describe("shared UI primitives", () => {
  it("renders badge content without adding interactive semantics", () => {
    render(<Badge variant="success">Connected</Badge>);

    const badge = screen.getByText("Connected");
    expect(badge).toHaveAttribute("data-slot", "badge");
    expect(badge).not.toHaveAttribute("role");
  });

  it("keeps Base UI button behavior and forwards accessible attributes", () => {
    const onClick = vi.fn();
    render(
      <Button aria-label="Run selected workflow" onClick={onClick}>
        Run workflow
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Run selected workflow" });
    expect(button).toHaveAttribute("data-slot", "button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("composes an alert while leaving live-region semantics explicit", () => {
    render(
      <Alert role="alert" variant="destructive">
        <AlertTitle>Workflow unavailable</AlertTitle>
        <AlertDescription>Try again after the API starts.</AlertDescription>
      </Alert>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("data-slot", "alert");
    expect(alert).toHaveTextContent("Workflow unavailable");
    expect(alert).toHaveTextContent("Try again after the API starts.");
  });
});
