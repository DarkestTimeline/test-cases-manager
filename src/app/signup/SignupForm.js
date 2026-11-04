"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "./actions";
import Button from "@/components/Button";
import Field, { RequiredNote } from "@/components/Field";
import PasswordInput from "@/components/PasswordInput";
import { AUTH_INPUT } from "@/lib/authStyles";

const initialState = { error: null, displayName: "", email: "" };

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <>
      <h1 className="mb-1 text-lg">Create an account</h1>
      <p className="mb-6 text-sm text-slate-500">
        You&apos;ll need an invite code to sign up.
      </p>

      {state.error && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <RequiredNote allRequired />
        <Field label="Your Name">
          <input
            key={`name-${state.error}`}
            type="text"
            name="displayName"
            defaultValue={state.displayName}
            placeholder="Jane Smith"
            autoComplete="name"
            required
            className={AUTH_INPUT}
          />
        </Field>
        <Field label="Email">
          <input
            key={`email-${state.error}`}
            type="email"
            name="email"
            defaultValue={state.email}
            placeholder="you@company.com"
            autoComplete="email"
            required
            className={AUTH_INPUT}
          />
        </Field>
        <Field label="Password" hint="At least 6 characters.">
          <PasswordInput
            name="password"
            placeholder="Choose a password"
            autoComplete="new-password"
            required
            minLength={6}
            className={AUTH_INPUT}
          />
        </Field>
        <Field label="Invite Code">
          <input
            type="text"
            name="inviteCode"
            autoComplete="off"
            required
            className={AUTH_INPUT}
          />
        </Field>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
