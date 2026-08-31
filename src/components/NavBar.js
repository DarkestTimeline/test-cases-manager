"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import StartRunButton from "./StartRunButton";

const NAV_ITEMS = [
  { href: "/test-cases", label: "Test Cases" },
  { href: "/modules", label: "Modules" },
  { href: "/suites", label: "Suites" },
  { href: "/runs", label: "Runs" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar({ suites }) {
  const pathname = usePathname();

  return (
    <nav className="bg-white px-6 py-3 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link href="/" className="font-bold text-primary text-lg mr-4">
            QA Test Manager
          </Link>
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
      </div>
    </nav>
  );
}
