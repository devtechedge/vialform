import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import type { OrgRole, StaffRole, VerificationStatus } from "@/domain/enums";

const COOKIE_NAME = "vialform_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  staffRole: StaffRole | null;
  emailVerified: boolean;
};

export type Membership = {
  organizationId: string;
  role: OrgRole;
  organizationName: string;
  verificationStatus: VerificationStatus;
  country: string;
  deliveryCountry: string;
  isConsumerDestination: boolean;
};

export type SessionContext = { user: SessionUser; memberships: Membership[] };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Create a session; only the SHA-256 hash of the token is stored. */
export async function createSession(userId: string, meta?: { ip?: string; userAgent?: string }): Promise<string> {
  const db = await getDb();
  const token = randomBytes(32).toString("hex");
  await db.insert(schema.sessions).values({
    id: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    ipHash: meta?.ip ? hashToken(meta.ip) : null,
    userAgent: meta?.userAgent?.slice(0, 255) ?? null,
  });
  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const db = await getDb();
  const rows = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      fullName: schema.users.fullName,
      staffRole: schema.users.staffRole,
      emailVerified: schema.users.emailVerified,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(
      and(
        eq(schema.sessions.id, hashToken(token)),
        gt(schema.sessions.expiresAt, new Date()),
        isNull(schema.sessions.revokedAt),
        eq(schema.users.status, "ACTIVE"),
      ),
    );
  return rows[0] ?? null;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const db = await getDb();
  const memberships = await db
    .select({
      organizationId: schema.memberships.organizationId,
      role: schema.memberships.role,
      organizationName: schema.organizations.name,
      verificationStatus: schema.organizations.verificationStatus,
      country: schema.organizations.country,
      deliveryCountry: schema.organizations.deliveryCountry,
      isConsumerDestination: schema.organizations.isConsumerDestination,
    })
    .from(schema.memberships)
    .innerJoin(schema.organizations, eq(schema.memberships.organizationId, schema.organizations.id))
    .where(eq(schema.memberships.userId, user.id));
  return { user, memberships };
}

export async function revokeCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    const db = await getDb();
    await db.update(schema.sessions).set({ revokedAt: new Date() }).where(eq(schema.sessions.id, hashToken(token)));
  }
  await clearSessionCookie();
}