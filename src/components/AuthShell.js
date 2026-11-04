import ThemeToggle from "./ThemeToggle";
import AuthBackground from "./AuthBackground";
import {
  CheckSquareIcon,
  ProjectsIcon,
  TestCasesIcon,
  SuitesIcon,
  RunsIcon,
  ReportsIcon,
  ImportExportIcon,
  KeyboardIcon,
  MoonIcon,
} from "./icons";

const WHATS_INSIDE = [
  { Icon: ProjectsIcon, label: "Projects" },
  { Icon: TestCasesIcon, label: "Test cases" },
  { Icon: SuitesIcon, label: "Suites" },
  { Icon: RunsIcon, label: "Runs" },
  { Icon: ReportsIcon, label: "Reports" },
  { Icon: ImportExportIcon, label: "CSV import/export" },
  { Icon: KeyboardIcon, label: "Keyboard shortcuts" },
  { Icon: MoonIcon, label: "Dark mode" },
];

// Centered card over a playful field of QA icons, shared by sign in and sign up.
export default function AuthShell({ children }) {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      <AuthBackground />
      <div className="absolute right-4 top-4">
        <ThemeToggle variant="icon" />
      </div>

      <main className="relative w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <CheckSquareIcon size={24} />
          </span>
          <p className="text-lg font-semibold text-slate-900">
            QA Test Manager
          </p>
          <p className="mt-1 text-sm text-slate-500">
            A small tool for manual test cases, suites and runs.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          {children}
        </div>

        <ul className="mt-8 flex flex-wrap justify-center gap-2">
          {WHATS_INSIDE.map(({ Icon, label }) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border bg-slate-100 px-3 py-1 text-xs text-slate-500"
            >
              <Icon size={14} />
              {label}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center font-mono text-xs text-slate-400">
          built with Next.js + Supabase
        </p>
      </main>
    </div>
  );
}
