"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import StartRunButton from "./StartRunButton";
import { logout } from "@/app/login/actions";

const NAV_ITEMS = [
  { href: "/test-cases", label: "Test Cases" },
  { href: "/modules", label: "Modules" },
  { href: "/suites", label: "Suites" },
  { href: "/runs", label: "Runs" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar({ suites, profile }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!profile) {
    return (
      <nav className="bg-white px-6 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <span className="font-bold text-primary text-lg">
            QA Test Manager
          </span>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white px-6 py-3 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="font-bold text-primary text-lg">
          QA Test Manager
        </Link>

        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? "border-primary text-primary font-semibold"
                      : "border-transparent text-slate-600 hover:text-primary hover:border-slate-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          <span className="text-sm text-slate-500">{profile.display_name}</span>
          <StartRunButton suites={suites} />
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-slate-500 hover:text-danger"
            >
              Log out
            </button>
          </form>
        </div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="sm:hidden p-2 text-slate-600 text-xl"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden mt-3 pt-3 border-t space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded text-sm font-medium ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {profile.display_name}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-slate-500 hover:text-danger"
              >
                Log out
              </button>
            </form>
          </div>
          <div className="pt-2">
            <StartRunButton suites={suites} />
          </div>
        </div>
      )}
    </nav>
  );
}
