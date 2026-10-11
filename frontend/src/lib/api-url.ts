interface PublicApiUrlOptions {
  readonly configuredUrl: string | undefined;
  readonly isDev: boolean;
}

export function resolvePublicApiUrl({
  configuredUrl,
  isDev,
}: PublicApiUrlOptions): string {
  const candidate = configuredUrl?.trim();

  if (!candidate) {
    if (isDev) {
      return "http://localhost:3000";
    }

    throw new Error("PUBLIC_API_URL is required for production builds");
  }

  const url = new URL(candidate);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("PUBLIC_API_URL must use http or https");
  }

  return url.toString().replace(/\/$/, "");
}
