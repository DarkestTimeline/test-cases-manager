"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

export default function NavBar({ profile }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [prevProfileId, setPrevProfileId] = useState(profile?.id);
  const accountRef = useRef(null);

  if (profile?.id !== prevProfileId) {
    setPrevProfileId(profile?.id);
    setIsAccountOpen(false);
    setIsMenuOpen(false);
  }

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

  const isProjectsActive = pathname.startsWith("/projects");

  return (
    <nav className="bg-white px-6 py-3 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/projects" className="font-bold text-primary text-lg">
          QA Test Manager
        </Link>

        <div className="hidden sm:flex items-center gap-4">
          <Link
            href="/projects"
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              isProjectsActive
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-slate-600 hover:text-primary hover:border-slate-200"
            }`}
          >
            Projects
          </Link>

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
                {profile.role === "admin" && (
                  <Link
                    href="/admin/users"
                    onClick={() => setIsAccountOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    Manage Users
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={() => setIsAccountOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Profile
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
          <Link
            href="/projects"
            onClick={() => setIsMenuOpen(false)}
            className={`block px-3 py-2 rounded text-sm font-medium ${
              isProjectsActive
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Projects
          </Link>
          {profile.role === "admin" && (
            <Link
              href="/admin/users"
              onClick={() => setIsMenuOpen(false)}
              className={`block px-3 py-2 rounded text-sm font-medium ${
                pathname.startsWith("/admin")
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Manage Users
            </Link>
          )}
          <Link
            href="/profile"
            onClick={() => setIsMenuOpen(false)}
            className={`block px-3 py-2 rounded text-sm font-medium ${
              pathname.startsWith("/profile")
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Profile
          </Link>
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
