import { describe, expect, it } from "vitest";

import { applySecurityHeaders } from "@/lib/security-headers";

describe("frontend security headers", () => {
  it("sets a restrictive browser policy and allows the configured API origin", () => {
    const response = new Response("AgentFlow Live");

    applySecurityHeaders(response, "https://api.example.test/v1");

    expect(response.headers.get("content-security-policy")).toContain(
      "connect-src 'self' https://api.example.test",
    );
    expect(response.headers.get("content-security-policy")).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });
});
