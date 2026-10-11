import { describe, expect, it } from "vitest";

import { resolvePublicApiUrl } from "../src/lib/api-url";

describe("resolvePublicApiUrl", () => {
  it("normalizes an explicit API URL", () => {
    expect(
      resolvePublicApiUrl({ configuredUrl: "https://api.example.test/", isDev: false }),
    ).toBe("https://api.example.test");
  });

  it("uses localhost only during development", () => {
    expect(resolvePublicApiUrl({ configuredUrl: undefined, isDev: true })).toBe(
      "http://localhost:3000",
    );
  });

  it("fails clearly when production configuration is absent", () => {
    expect(() =>
      resolvePublicApiUrl({ configuredUrl: undefined, isDev: false }),
    ).toThrow("PUBLIC_API_URL is required for production builds");
  });

  it("rejects a non-HTTP URL", () => {
    expect(() =>
      resolvePublicApiUrl({ configuredUrl: "file:///tmp/api", isDev: false }),
    ).toThrow("PUBLIC_API_URL must use http or https");
  });
});
