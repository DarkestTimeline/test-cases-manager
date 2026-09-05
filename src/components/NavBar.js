"use client";

import { useState, useRef, useEffect } from "react";
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
];

export default function NavBar({ suites, profile }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setIsAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

          <StartRunButton suites={suites} />

          <div className="relative" ref={accountRef}>
            <button
              onClick={() => setIsAccountOpen(!isAccountOpen)}
              className="flex items-center gap-2 pl-4 border-l text-sm text-slate-600 hover:text-primary"
            >
              <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-semibold">
                {profile.display_name?.charAt(0).toUpperCase() || "?"}
              </span>
              {profile.display_name}
              <span className="text-xs">{isAccountOpen ? "▲" : "▼"}</span>
            </button>

            {isAccountOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg py-1 z-50">
                <Link
                  href="/settings"
                  onClick={() => setIsAccountOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Settings
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    Log out
                  </button>
                </form>
              </div>
            )}
          </div>
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
          <Link
            href="/settings"
            onClick={() => setIsMenuOpen(false)}
            className={`block px-3 py-2 rounded text-sm font-medium ${
              pathname.startsWith("/settings")
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Settings
          </Link>
          <div className="pt-2">
            <StartRunButton suites={suites} />
          </div>
          <div className="pt-3 mt-1 border-t flex items-center justify-between">
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
        </div>
      )}
    </nav>
  );
}
