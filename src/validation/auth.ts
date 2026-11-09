import { z } from "zod";
import { ORG_TYPES } from "@/domain/enums";

export const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "IN", label: "India" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "SE", label: "Sweden" },
  { code: "EU", label: "European Union" },
  { code: "JP", label: "Japan" },
  { code: "AU", label: "Australia" },
  { code: "CA", label: "Canada" },
] as const;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z.object({
  fullName: z.string().min(2, "Enter your full name.").max(120),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(10, "Use at least 10 characters.").max(200),
  organizationName: z.string().min(2, "Enter your institution name.").max(160),
  orgType: z.enum(ORG_TYPES),
  country: z.string().min(2).max(3),
  purpose: z.string().min(10, "Describe the lawful research purpose.").max(1000),
});

export type SignupInput = z.infer<typeof signupSchema>;