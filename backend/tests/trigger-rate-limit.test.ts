import { NestFactory } from "@nestjs/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppModule } from "../src/app.module.js";

describe("workflow trigger rate limit", () => {
  let closeApplication: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await closeApplication?.();
    closeApplication = undefined;
    vi.restoreAllMocks();
  });

  it("limits only rapid workflow triggers and returns retry metadata", async () => {
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.listen(0, "127.0.0.1");
    closeApplication = () => app.close();
    const origin = await app.getUrl();
    const request = (clientAddress = "203.0.113.10") =>
      fetch(`${origin}/workflows/password-reset/trigger`, {
        method: "POST",
        headers: { "x-real-ip": clientAddress },
      });

    const accepted = await Promise.all([request(), request(), request()]);
    expect(accepted.map((response) => response.status)).toEqual([202, 202, 202]);
    expect(accepted[0]?.headers.get("x-ratelimit-limit-burst")).toBe("3");
    expect(accepted[0]?.headers.get("x-ratelimit-limit-sustained")).toBe("10");

    const rejected = await request();
    expect(rejected.status).toBe(429);
    expect(rejected.headers.get("retry-after-burst")).toMatch(/^\d+$/);
    await expect(rejected.json()).resolves.toEqual({
      error: {
        code: "too_many_requests",
        message: expect.any(String),
      },
    });

    expect((await request("203.0.113.11")).status).toBe(202);

    const invalidHeaderStatuses: number[] = [];
    for (const clientAddress of ["spoof-1", "spoof-2", "spoof-3", "spoof-4"]) {
      invalidHeaderStatuses.push((await request(clientAddress)).status);
    }
    expect(invalidHeaderStatuses).toEqual([202, 202, 202, 429]);

    const healthChecks = await Promise.all(
      Array.from({ length: 5 }, () => fetch(`${origin}/health`)),
    );
    expect(healthChecks.every((response) => response.status === 200)).toBe(true);
  });

  it("enforces the sustained window across expired burst windows", async () => {
    let now = new Date("2026-10-16T10:00:00.000Z").getTime();
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const app = await NestFactory.create(AppModule, { logger: false });
    await app.listen(0, "127.0.0.1");
    closeApplication = () => app.close();
    const origin = await app.getUrl();
    const request = () =>
      fetch(`${origin}/workflows/password-reset/trigger`, {
        method: "POST",
        headers: { "x-real-ip": "203.0.113.20" },
      });

    for (const batchSize of [3, 3, 3, 1]) {
      const batch = await Promise.all(Array.from({ length: batchSize }, request));
      expect(batch.every((response) => response.status === 202)).toBe(true);
      now += 10_001;
    }

    const rejected = await request();
    expect(rejected.status).toBe(429);
    expect(rejected.headers.get("retry-after-sustained")).toMatch(/^\d+$/);
  });
});
