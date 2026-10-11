import { describe, expect, it } from "vitest";

import { resolveBackendConfig } from "../src/config.js";

describe("resolveBackendConfig", () => {
  it("uses safe local defaults", () => {
    expect(resolveBackendConfig({})).toEqual({
      frontendOrigin: "http://localhost:4321",
      port: 3000,
    });
  });

  it("accepts a valid configured port and origin", () => {
    expect(
      resolveBackendConfig({
        FRONTEND_ORIGIN: "https://example.test",
        PORT: "4100",
      }),
    ).toEqual({
      frontendOrigin: "https://example.test",
      port: 4100,
    });
  });

  it.each(["0", "65536", "3000.5", "not-a-number"])(
    "rejects invalid PORT=%s",
    (port) => {
      expect(() => resolveBackendConfig({ PORT: port })).toThrow(
        `PORT must be an integer between 1 and 65535; received ${port}`,
      );
    },
  );

  it.each(["file:///tmp/app", "https://example.test/path"])(
    "rejects invalid FRONTEND_ORIGIN=%s",
    (frontendOrigin) => {
      expect(() =>
        resolveBackendConfig({ FRONTEND_ORIGIN: frontendOrigin }),
      ).toThrow("FRONTEND_ORIGIN must be an HTTP(S) origin without a path");
    },
  );
});
