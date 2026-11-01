"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { PAGE } from '@/lib/pageWidths'

const SETTINGS_NAV = [
  { label: "Import", path: "settings/import" },
  { label: "Export", path: "settings/export" },
];

export default function SettingsLayout({ children }) {
  const pathname = usePathname();
  const { code } = useParams();

  return (
    <main className={PAGE.medium}>
      <h1 className="mb-4">Import / Export</h1>

      <div className="flex gap-1 mb-6 border-b">
        {SETTINGS_NAV.map((item) => {
          const href = `/projects/${code}/${item.path}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={item.path}
              href={href}
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
