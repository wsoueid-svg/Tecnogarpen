import { createHmac } from "node:crypto";

function base64url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

/**
 * Short-lived HS256 token for PostgREST. `sub` is app_user.id, so auth.uid() lines up
 * with the mock directory when DATA_BACKEND=supabase. The Supabase project is expected
 * in Frankfurt (eu-central-1); the URL itself carries the project.
 */
export function signSupabaseJwt(userId: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      aud: "authenticated",
      role: "authenticated",
      sub: userId,
      iat: nowSeconds,
      exp: nowSeconds + 60 * 60,
    }),
  );
  const data = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(data).digest("base64url");
  return `${data}.${signature}`;
}
