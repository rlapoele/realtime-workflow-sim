export interface BackendConfig {
  readonly frontendOrigin: string;
  readonly port: number;
}

type Environment = Readonly<Record<string, string | undefined>>;

const DEFAULT_FRONTEND_ORIGIN = "http://localhost:4321";
const DEFAULT_PORT = 3000;

function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_PORT;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`PORT must be an integer between 1 and 65535; received ${value}`);
  }

  return port;
}

function parseOrigin(value: string | undefined): string {
  const candidate = value?.trim() || DEFAULT_FRONTEND_ORIGIN;

  try {
    const url = new URL(candidate);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.origin !== candidate.replace(/\/$/, "")
    ) {
      throw new Error();
    }
    return url.origin;
  } catch {
    throw new Error(
      `FRONTEND_ORIGIN must be an HTTP(S) origin without a path; received ${candidate}`,
    );
  }
}

export function resolveBackendConfig(environment: Environment): BackendConfig {
  return {
    frontendOrigin: parseOrigin(environment.FRONTEND_ORIGIN),
    port: parsePort(environment.PORT),
  };
}
