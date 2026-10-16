import { type ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard, type ThrottlerLimitDetail } from "@nestjs/throttler";
import { isIP } from "node:net";

import { tooManyRequests } from "../http-errors.js";

export const triggerThrottlers = [
  { name: "burst", limit: 3, ttl: 10_000 },
  { name: "sustained", limit: 10, ttl: 60_000 },
] as const;

@Injectable()
export class TriggerThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(request: Record<string, unknown>): Promise<string> {
    const headers = request.headers as Record<string, unknown> | undefined;
    const forwardedAddress = headers?.["x-real-ip"];
    const clientAddress = Array.isArray(forwardedAddress)
      ? forwardedAddress[0]
      : forwardedAddress;
    const fallbackAddress = request.ip;
    const trustedAddress =
      typeof clientAddress === "string" ? clientAddress.trim() : undefined;

    return Promise.resolve(
      trustedAddress !== undefined && isIP(trustedAddress) !== 0
        ? trustedAddress
        : typeof fallbackAddress === "string" && fallbackAddress !== ""
          ? fallbackAddress
          : "unknown-client",
    );
  }

  protected override async throwThrottlingException(
    _context: ExecutionContext,
    _limit: ThrottlerLimitDetail,
  ): Promise<void> {
    throw tooManyRequests("Too many workflow starts. Try again after the retry interval.");
  }
}
