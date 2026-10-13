import { defineMiddleware } from "astro:middleware";

import { resolvePublicApiUrl } from "@/lib/api-url";
import { applySecurityHeaders } from "@/lib/security-headers";

const apiUrl = resolvePublicApiUrl({
  configuredUrl: import.meta.env.PUBLIC_API_URL,
  isDev: import.meta.env.DEV,
});

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  applySecurityHeaders(response, apiUrl);
  return response;
});
