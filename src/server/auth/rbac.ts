import type { OrgRole, StaffRole } from "@/domain/enums";
import { getSessionContext, getSessionUser, type Membership, type SessionContext, type SessionUser } from "./sessions";

export class AuthError extends Error {
  constructor(message: string, public readonly status: number = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Authentication required.", 401);
  return user;
}

export async function requireContext(): Promise<SessionContext> {
  const context = await getSessionContext();
  if (!context) throw new AuthError("Authentication required.", 401);
  return context;
}

/** Require a staff user, optionally constrained to specific staff roles. */
export async function requireStaff(roles?: readonly StaffRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.staffRole) throw new AuthError("Staff access required.", 403);
  if (roles && !roles.includes(user.staffRole)) throw new AuthError("Insufficient staff role.", 403);
  return user;
}

/**
 * Require membership in the given organization with an optional role. The
 * organization id is checked against the session, never trusted from input.
 */
export async function requireOrgRole(organizationId: string, roles?: readonly OrgRole[]): Promise<{ user: SessionUser; membership: Membership }> {
  const context = await requireContext();
  const membership = context.memberships.find((entry) => entry.organizationId === organizationId);
  if (!membership) throw new AuthError("You do not belong to this organization.", 403);
  if (roles && !roles.includes(membership.role)) throw new AuthError("Insufficient organization role.", 403);
  return { user: context.user, membership };
}

export function primaryMembership(context: SessionContext): Membership | null {
  return context.memberships[0] ?? null;
}