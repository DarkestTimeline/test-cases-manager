"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "./actions";
import Button from "@/components/Button";

const initialState = { error: null, displayName: "", email: "" };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-sm bg-white border rounded-lg p-8 shadow-sm">
        <h1 className="mb-1 text-center">Create an Account</h1>
        <p className="text-slate-500 text-sm text-center mb-6">
          You&apos;ll need an invite code to sign up
        </p>

        {state.error && (
          <p className="text-danger text-sm mb-4 text-center">{state.error}</p>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your Name</label>
            <input
              key={`name-${state.error}`}
              type="text"
              name="displayName"
              defaultValue={state.displayName}
              required
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              key={`email-${state.error}`}
              type="email"
              name="email"
              defaultValue={state.email}
              required
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Invite Code
            </label>
            <input
              type="text"
              name="inviteCode"
              required
              className="w-full border rounded p-2"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-sm text-slate-500 text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
