"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SETTINGS_NAV = [
  { label: "Import", href: "/settings/import" },
  { label: "Export", href: "/settings/export" },
];

export default function SettingsLayout({ children }) {
  const pathname = usePathname();

  return (
    <main className="p-8 w-full max-w-3xl mx-auto">
      <h1 className="mb-4">Settings</h1>

      <div className="flex gap-1 mb-6 border-b">
        {SETTINGS_NAV.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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

      {children}
    </main>
  );
}
