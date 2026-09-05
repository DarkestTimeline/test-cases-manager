import { login, loginAsDemo } from "./actions";
import Button from "@/components/Button";
import Link from "next/link";

export default async function LoginPage({ searchParams }) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="w-full max-w-sm bg-white border rounded-lg p-8 shadow-sm">
        <h1 className="mb-1 text-center">QA Test Manager</h1>
        <p className="text-slate-500 text-sm text-center mb-6">
          Sign in to continue
        </p>

        {error && (
          <p className="text-danger text-sm mb-4 text-center">{error}</p>
        )}

        <form action={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
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
              className="w-full border rounded p-2"
            />
          </div>
          <Button type="submit" className="w-full">
            Sign In
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
          <p className="text-sm text-slate-500 text-center mt-4">
            Need an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
