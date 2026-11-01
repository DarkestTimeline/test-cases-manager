"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, loginAsDemo } from "./actions";
import Button from "@/components/Button";
import Field from "@/components/Field";

export default function LoginForm({ initialError }) {
  const [state, formAction, isPending] = useActionState(login, {
    error: initialError,
    email: "",
  });
  const retrying = Boolean(state.error && state.email);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-sm bg-white border rounded-lg p-8 shadow-sm">
        <h1 className="mb-1 text-center">QA Test Manager</h1>
        <p className="text-slate-500 text-sm text-center mb-6">
          Sign in to continue
        </p>

        {state.error && (
          <p className="text-danger text-sm mb-4 text-center">{state.error}</p>
        )}

        <form action={formAction} className="space-y-4">
          <Field label="Email">
            <input
              key={`email-${state.error}`}
              type="email"
              name="email"
              defaultValue={state.email}
              required
              autoFocus={!retrying}
              className="w-full border rounded p-2"
            />
          </Field>
          <Field label="Password">
            <input
              key={`password-${state.error}`}
              type="password"
              name="password"
              required
              autoFocus={retrying}
              className="w-full border rounded p-2"
            />
          </Field>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 border-t" />
          <span className="text-xs text-slate-400">or</span>
          <div className="flex-1 border-t" />
        </div>

        <form action={loginAsDemo}>
          <Button type="submit" variant="secondary" className="w-full">
            Try the Demo
          </Button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-4">
          Need an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
