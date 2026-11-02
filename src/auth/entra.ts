export type AuthMode = "mock" | "entra";

export type EntraStatus = {
  mode: AuthMode;
  tenantConfigured: boolean;
  clientConfigured: boolean;
  secretConfigured: boolean;
};

export function authMode(env: NodeJS.ProcessEnv = process.env): AuthMode {
  return env.AUTH_MODE?.trim() === "entra" ? "entra" : "mock";
}

/** Presence only. The secret value never leaves the server and is not returned. */
export function entraStatus(env: NodeJS.ProcessEnv = process.env): EntraStatus {
  return {
    mode: authMode(env),
    tenantConfigured: Boolean(env.ENTRA_TENANT_ID?.trim()),
    clientConfigured: Boolean(env.ENTRA_CLIENT_ID?.trim()),
    secretConfigured: Boolean(env.ENTRA_CLIENT_SECRET?.trim()),
  };
}
