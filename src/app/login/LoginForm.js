"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, loginAsDemo } from "./actions";
import Button from "@/components/Button";
import Field from "@/components/Field";
import PasswordInput from "@/components/PasswordInput";
import { AUTH_INPUT } from "@/lib/authStyles";

export default function LoginForm({ initialError }) {
  const [state, formAction, isPending] = useActionState(login, {
    error: initialError,
    email: "",
  });
  const retrying = Boolean(state.error && state.email);

  return (
    <>
      <h1 className="mb-6 text-lg">Sign in</h1>

      {state.error && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <Field label="Email">
          <input
            key={`email-${state.error}`}
            type="email"
            name="email"
            defaultValue={state.email}
            placeholder="you@company.com"
            autoComplete="email"
            required
            autoFocus={!retrying}
            className={AUTH_INPUT}
          />
        </Field>
        <Field label="Password">
          <PasswordInput
            key={`password-${state.error}`}
            name="password"
            placeholder="Your password"
            autoComplete="current-password"
            required
            autoFocus={retrying}
            className={AUTH_INPUT}
          />
        </Field>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 border-t" />
        <span className="text-xs text-slate-400">or</span>
        <div className="flex-1 border-t" />
      </div>

      <form action={loginAsDemo}>
        <Button
          type="submit"
          variant="secondary"
          size="lg"
          className="w-full"
        >
          Try the Demo
        </Button>
        <p className="mt-2 text-center text-xs text-slate-400">
          Explore with sample data. No account needed.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Need an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
