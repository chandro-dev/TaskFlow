import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export interface SessionPayload {
  userId: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  expiresAt: string;
}

const SESSION_COOKIE_NAME = "taskflow_session";

function resolveSessionSecret() {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "taskflow-dev-secret"
  );
}

function encodePayload(payload: SessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", resolveSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function serializeSession(payload: SessionPayload) {
  const encodedPayload = encodePayload(payload);
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

async function persistSession(sessionPayload: SessionPayload) {
  (await cookies()).set({
    name: SESSION_COOKIE_NAME,
    value: serializeSession(sessionPayload),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(sessionPayload.expiresAt),
    path: "/",
  });
}

function parseSessionValue(value: string): SessionPayload | null {
  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length) {
    return null;
  }

  if (!timingSafeEqual(provided, expected)) {
    return null;
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  ) as SessionPayload;

  if (!payload.userId || !payload.email || !payload.expiresAt) {
    return null;
  }

  if (new Date(payload.expiresAt) <= new Date()) {
    return null;
  }

  return payload;
}

export async function createSession(payload: Omit<SessionPayload, "expiresAt">) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const sessionPayload: SessionPayload = {
    ...payload,
    expiresAt: expiresAt.toISOString(),
  };

  await persistSession(sessionPayload);
}

export async function clearSession() {
  (await cookies()).set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!value) {
    return null;
  }

  return parseSessionValue(value);
}

export async function updateSessionTokens(
  nextTokens: Pick<
    SessionPayload,
    "accessToken" | "refreshToken" | "accessTokenExpiresAt"
  >,
) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const updatedSession: SessionPayload = {
    ...session,
    ...nextTokens,
  };

  try {
    await persistSession(updatedSession);
  } catch {
    return updatedSession;
  }

  return updatedSession;
}
