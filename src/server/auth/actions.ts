"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { loginSchema, signupSchema } from "@/validation/auth";
import { recordAudit } from "@/server/audit";
import { rateLimit } from "@/server/rate-limit";
import { hashPassword, verifyPassword } from "./password";
import { createSession, revokeCurrentSession, setSessionCookie } from "./sessions";

export type AuthState = { error?: string };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

function slugify(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}-${randomBytes(3).toString("hex")}`;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}:${parsed.data.email}`, 10, 15 * 60 * 1000).allowed) {
    return { error: "Too many attempts. Try again later." };
  }
  const db = await getDb();
  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email.toLowerCase()));
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  if (user.status !== "ACTIVE") return { error: "This account is suspended." };
  const token = await createSession(user.id, { ip, userAgent: (await headers()).get("user-agent") ?? undefined });
  await setSessionCookie(token);
  await recordAudit(db, { actorId: user.id, action: "LOGIN", entityType: "user", entityId: user.id, summary: "User signed in." });
  redirect(user.staffRole ? "/admin" : "/workspace");
}

export async function signupAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    organizationName: String(formData.get("organizationName") ?? ""),
    orgType: String(formData.get("orgType") ?? ""),
    country: String(formData.get("country") ?? ""),
    purpose: String(formData.get("purpose") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const ip = await clientIp();
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000).allowed) {
    return { error: "Too many attempts. Try again later." };
  }
  const db = await getDb();
  const email = parsed.data.email.toLowerCase();
  const [existing] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (existing) return { error: "An account with this email already exists." };
  const passwordHash = await hashPassword(parsed.data.password);

  const user = await db.transaction(async (tx) => {
    const [created] = await tx.insert(schema.users).values({ email, passwordHash, fullName: parsed.data.fullName, emailVerified: false }).returning();
    const [org] = await tx.insert(schema.organizations).values({
      name: parsed.data.organizationName,
      slug: slugify(parsed.data.organizationName),
      type: parsed.data.orgType,
      country: parsed.data.country,
      deliveryCountry: parsed.data.country,
      verificationStatus: "UNVERIFIED",
    }).returning();
    if (!created || !org) throw new Error("Failed to create account.");
    await tx.insert(schema.memberships).values({ organizationId: org.id, userId: created.id, role: "OWNER" });
    await tx.insert(schema.verificationRequests).values({
      organizationId: org.id,
      submittedBy: created.id,
      legalName: parsed.data.organizationName,
      purpose: parsed.data.purpose,
      status: "PENDING",
    });
    await recordAudit(tx, { actorId: created.id, action: "SIGNUP", entityType: "user", entityId: created.id, summary: "Institution account created; verification pending." });
    return created;
  });

  const token = await createSession(user.id, { ip });
  await setSessionCookie(token);
  redirect("/workspace");
}

export async function logoutAction(): Promise<void> {
  await revokeCurrentSession();
  redirect("/");
}