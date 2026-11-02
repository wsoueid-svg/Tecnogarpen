import { createHmac, timingSafeEqual } from "node:crypto";

export function signSession(userId: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(userId).digest("base64url");
  return `${userId}.${signature}`;
}

export function readSession(token: string | undefined, secret: string): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(userId).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  return userId;
}
