import { boolean, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import type { OrgRole, OrgType, StaffRole, VerificationRequestStatus, VerificationStatus } from "@/domain/enums";
import { createdAt, isDemo, revision, updatedAt } from "./columns";

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").$type<OrgType>().notNull(),
  country: text("country").notNull(),
  deliveryCountry: text("delivery_country").notNull(),
  website: text("website"),
  verificationStatus: text("verification_status").$type<VerificationStatus>().notNull().default("UNVERIFIED"),
  isConsumerDestination: boolean("is_consumer_destination").notNull().default(false),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  staffRole: text("staff_role").$type<StaffRole>(),
  emailVerified: boolean("email_verified").notNull().default(false),
  status: text("status").$type<"ACTIVE" | "SUSPENDED">().notNull().default("ACTIVE"),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<OrgRole>().notNull().default("MEMBER"),
    createdAt: createdAt(),
  },
  (table) => [unique("memberships_org_user_unique").on(table.organizationId, table.userId)],
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
});

export const verificationRequests = pgTable("verification_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  submittedBy: uuid("submitted_by").notNull().references(() => users.id),
  legalName: text("legal_name").notNull(),
  registrationNumber: text("registration_number"),
  purpose: text("purpose").notNull(),
  documentKeys: jsonb("document_keys").$type<string[]>().notNull().default([]),
  status: text("status").$type<VerificationRequestStatus>().notNull().default("PENDING"),
  reviewerId: uuid("reviewer_id").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  revision: revision(),
  isDemo: isDemo(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});