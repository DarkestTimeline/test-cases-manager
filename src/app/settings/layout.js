import Link from "next/link";

const SETTINGS_NAV = [
  // Future sessions add entries here, e.g.:
  // { label: 'Import', href: '/settings/import' },
  // { label: 'Export', href: '/settings/export' },
];

export default function SettingsLayout({ children }) {
  return (
    <main className="p-8 w-full max-w-3xl mx-auto">
      <h1 className="mb-4">Settings</h1>

      {SETTINGS_NAV.length > 0 && (
        <div className="flex gap-2 mb-6 border-b pb-2">
          {SETTINGS_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 hover:text-primary px-2 py-1"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {children}
    </main>
  );
}
