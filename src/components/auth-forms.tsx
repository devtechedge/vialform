"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, signupAction, type AuthState } from "@/server/auth/actions";
import { ORG_TYPES } from "@/domain/enums";

const COUNTRIES = [
  ["US", "United States"], ["IN", "India"], ["GB", "United Kingdom"], ["DE", "Germany"],
  ["FR", "France"], ["SE", "Sweden"], ["EU", "European Union"], ["JP", "Japan"], ["AU", "Australia"], ["CA", "Canada"],
] as const;

const inputClass = "h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-ink placeholder:text-muted focus:border-cobalt focus:outline-none";
const labelClass = "mono mb-1 block text-[11px] uppercase tracking-wide text-muted";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="h-10 w-full rounded-md bg-cobalt px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">
      {pending ? "Please wait…" : label}
    </button>
  );
}

function ErrorNote({ state }: { state: AuthState }) {
  if (!state.error) return null;
  return <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>;
}

export function LoginForm() {
  const [state, action] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <ErrorNote state={state} />
      <div>
        <label htmlFor="email" className={labelClass}>Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      <SubmitButton label="Sign in" />
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useActionState(signupAction, {});
  return (
    <form action={action} className="space-y-4">
      <ErrorNote state={state} />
      <div>
        <label htmlFor="fullName" className={labelClass}>Full name</label>
        <input id="fullName" name="fullName" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>Work email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Password (min 10 characters)</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className={inputClass} />
      </div>
      <div>
        <label htmlFor="organizationName" className={labelClass}>Institution name</label>
        <input id="organizationName" name="organizationName" required className={inputClass} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="orgType" className={labelClass}>Institution type</label>
          <select id="orgType" name="orgType" className={inputClass} defaultValue="RESEARCH_INSTITUTE">
            {ORG_TYPES.map((type) => <option key={type} value={type}>{type.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="country" className={labelClass}>Country / delivery</label>
          <select id="country" name="country" className={inputClass} defaultValue="US">
            {COUNTRIES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="purpose" className={labelClass}>Lawful research purpose</label>
        <textarea id="purpose" name="purpose" rows={3} required minLength={10} className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-cobalt focus:outline-none" placeholder="Describe the institutional research or analytical reference purpose." />
      </div>
      <SubmitButton label="Apply for institution access" />
    </form>
  );
}