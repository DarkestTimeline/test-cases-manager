"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import StartRunButton from "./StartRunButton";
import ThemeToggle from "./ThemeToggle";
import { logout } from "@/app/login/actions";
import { projectTileColor, projectInitials } from "@/lib/projectColor";
import {
  ProjectsIcon,
  OverviewIcon,
  TestCasesIcon,
  StepBlocksIcon,
  ModulesIcon,
  SuitesIcon,
  RunsIcon,
  ReportsIcon,
  ImportExportIcon,
  UsersIcon,
  UserIcon,
  LogoutIcon,
  ChevronsUpDownIcon,
  PanelLeftIcon,
  MenuIcon,
  CloseIcon,
  CheckSquareIcon,
} from "./icons";

const PROJECT_ITEMS = [
  { slug: "", label: "Overview", Icon: OverviewIcon },
  { slug: "test-cases", label: "Test Cases", Icon: TestCasesIcon },
  { slug: "step-blocks", label: "Step Blocks", Icon: StepBlocksIcon },
  { slug: "modules", label: "Modules", Icon: ModulesIcon },
  { slug: "suites", label: "Suites", Icon: SuitesIcon },
  { slug: "runs", label: "Runs", Icon: RunsIcon },
  { slug: "reports", label: "Reports", Icon: ReportsIcon },
  { slug: "settings", label: "Import / Export", Icon: ImportExportIcon },
];

const MAX_QUICK_PROJECTS = 8;

function ProjectTile({ code, name, className = "" }) {
  const initials = projectInitials(name, code);
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-bold ${
        initials.length > 2 ? "text-[9px]" : "text-[11px]"
      } ${projectTileColor(code)} ${className}`}
    >
      {initials}
    </span>
  );
}

function SectionLabel({ children, collapsed }) {
  return (
    <p
      className={`px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-dim ${
        collapsed ? "md:hidden" : ""
      }`}
    >
      {children}
    </p>
  );
}

function NavItem({ href, label, active, collapsed, onNavigate, icon, children }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        collapsed ? "md:justify-center md:px-0" : ""
      } ${
        active
          ? "bg-sidebar-hover text-white"
          : "text-sidebar-muted hover:bg-sidebar-hover/60 hover:text-white"
      }`}
    >
      {icon && (
        <span className={`shrink-0 ${active ? "text-sidebar-accent" : ""}`}>
          {icon}
        </span>
      )}
      <span className={`truncate ${collapsed ? "md:hidden" : ""}`}>
        {children ?? label}
      </span>
    </Link>
  );
}

export default function AppSidebar({
  profile,
  projects,
  defaultCollapsed = false,
  children,
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [menu, setMenu] = useState(null); // null | "switcher" | "account"
  const switcherRef = useRef(null);
  const accountRef = useRef(null);

  useEffect(() => {
    function handleMouseDown(e) {
      if (
        switcherRef.current?.contains(e.target) ||
        accountRef.current?.contains(e.target)
      ) {
        return;
      }
      setMenu(null);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setMenu(null);
        setIsDrawerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    setMenu(null);
    document.cookie = `sidebar-collapsed=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
  }

  function closeAll() {
    setMenu(null);
    setIsDrawerOpen(false);
  }

  // Which project (if any) the current URL belongs to.
  const match = pathname.match(/^\/projects\/([^/]+)/);
  const code =
    match && match[1].toLowerCase() !== "new" ? match[1].toUpperCase() : null;
  const current = code
    ? (projects.find((p) => p.code === code) ?? {
        code,
        name: code,
        archived_at: null,
      })
    : null;
  const activeProjects = projects.filter((p) => !p.archived_at);
  const base = current ? `/projects/${current.code}` : null;

  // Switching projects keeps you in the same section (list level only).
  function hrefForProject(projectCode) {
    const section = pathname.split("/")[3];
    const isSection = PROJECT_ITEMS.some(
      (item) => item.slug && item.slug === section,
    );
    return isSection
      ? `/projects/${projectCode}/${section}`
      : `/projects/${projectCode}`;
  }

  const hide = collapsed ? "md:hidden" : "";
  const isAdmin = profile.role === "admin";

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="flex h-14 shrink-0 items-center justify-between bg-sidebar px-4 text-white md:hidden">
        <Link href="/projects" className="flex items-center gap-3 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <CheckSquareIcon size={18} />
          </span>
          QA Test Manager
        </Link>
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open menu"
          className="rounded p-2 text-sidebar-text hover:bg-sidebar-hover"
        >
          <MenuIcon />
        </button>
      </div>

      {isDrawerOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeAll}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r border-sidebar-line bg-sidebar text-sidebar-text transition-[transform,width] duration-200 md:sticky md:top-0 md:z-20 md:h-screen md:max-w-none md:shrink-0 md:translate-x-0 ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-16" : "md:w-64"}`}
      >
        {/* Brand */}
        <div
          className={`flex h-14 shrink-0 items-center gap-3 px-4 ${
            collapsed ? "md:justify-center md:px-0" : ""
          }`}
        >
          <Link
            href="/projects"
            onClick={closeAll}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <CheckSquareIcon size={18} />
            </span>
            <span className={`truncate font-semibold text-white ${hide}`}>
              QA Test Manager
            </span>
          </Link>
          <button
            type="button"
            onClick={closeAll}
            aria-label="Close menu"
            className="ml-auto rounded p-1.5 text-sidebar-muted hover:bg-sidebar-hover hover:text-white md:hidden"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Project switcher and Start run (inside a project) */}
        {current && (
          <div className="shrink-0 px-3 pb-2">
            <div className="relative" ref={switcherRef}>
              <button
                type="button"
                onClick={() => setMenu(menu === "switcher" ? null : "switcher")}
                aria-expanded={menu === "switcher"}
                title={collapsed ? `${current.code} — ${current.name}` : undefined}
                className={`flex w-full items-center gap-3 rounded-lg bg-sidebar-hover px-3 py-2 text-left transition-colors hover:bg-sidebar-raised ${
                  collapsed ? "md:justify-center md:px-0" : ""
                }`}
              >
                <ProjectTile code={current.code} name={current.name} />
                <span className={`min-w-0 flex-1 ${hide}`}>
                  <span className="block truncate text-sm font-semibold text-white">
                    {current.name}
                  </span>
                  <span className="block truncate font-mono text-xs text-sidebar-muted">
                    {current.code}
                    {current.archived_at ? " · archived" : ""}
                  </span>
                </span>
                <ChevronsUpDownIcon
                  size={16}
                  className={`shrink-0 text-sidebar-dim ${hide}`}
                />
              </button>

              {menu === "switcher" && (
                <div
                  className={`absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-white py-1 text-slate-700 shadow-lg ${
                    collapsed
                      ? "md:left-full md:right-auto md:top-0 md:ml-2 md:mt-0 md:w-64"
                      : ""
                  }`}
                >
                  <p className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Switch project
                  </p>
                  {activeProjects.map((p) => (
                    <Link
                      key={p.code}
                      href={hrefForProject(p.code)}
                      onClick={closeAll}
                      className={`flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-100 ${
                        p.code === current.code ? "font-semibold" : ""
                      }`}
                    >
                      <ProjectTile code={p.code} name={p.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{p.name}</span>
                        <span className="block truncate font-mono text-xs text-slate-400">
                          {p.code}
                        </span>
                      </span>
                    </Link>
                  ))}
                  <Link
                    href="/projects"
                    onClick={closeAll}
                    className="mt-1 flex items-center gap-3 border-t px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                  >
                    <ProjectsIcon size={18} />
                    All projects
                  </Link>
                </div>
              )}
            </div>

            {!current.archived_at && (
              <div className="mt-2">
                <StartRunButton
                  projectCode={current.code}
                  collapsed={collapsed}
                />
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav
          aria-label="Main"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2"
        >
          {current ? (
            <>
              {PROJECT_ITEMS.map(({ slug, label, Icon }) => {
                const href = slug ? `${base}/${slug}` : base;
                const active = slug
                  ? pathname.startsWith(href)
                  : pathname === base;
                return (
                  <NavItem
                    key={label}
                    href={href}
                    label={label}
                    active={active}
                    collapsed={collapsed}
                    onNavigate={closeAll}
                    icon={<Icon size={20} />}
                  />
                );
              })}
              <div className="my-3 border-t border-sidebar-line" />
              <NavItem
                href="/projects"
                label="All projects"
                active={false}
                collapsed={collapsed}
                onNavigate={closeAll}
                icon={<ProjectsIcon size={20} />}
              />
            </>
          ) : (
            <>
              <NavItem
                href="/projects"
                label="Projects"
                active={pathname === "/projects" || pathname === "/projects/new"}
                collapsed={collapsed}
                onNavigate={closeAll}
                icon={<ProjectsIcon size={20} />}
              />
              {activeProjects.length > 0 && (
                <>
                  <SectionLabel collapsed={collapsed}>Your projects</SectionLabel>
                  {collapsed && (
                    <div className="my-2 hidden border-t border-sidebar-line md:block" />
                  )}
                  {activeProjects.slice(0, MAX_QUICK_PROJECTS).map((p) => (
                    <NavItem
                      key={p.code}
                      href={`/projects/${p.code}`}
                      label={p.name}
                      active={false}
                      collapsed={collapsed}
                      onNavigate={closeAll}
                      icon={<ProjectTile code={p.code} name={p.name} />}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </nav>

        {/* Footer: collapse toggle and account */}
        <div className="shrink-0 space-y-1 border-t border-sidebar-line p-3">
          <ThemeToggle collapsed={collapsed} />
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : undefined}
            className={`hidden w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-dim transition-colors hover:bg-sidebar-hover/60 hover:text-white md:flex ${
              collapsed ? "md:justify-center md:px-0" : ""
            }`}
          >
            <PanelLeftIcon
              size={20}
              className={collapsed ? "scale-x-[-1]" : ""}
            />
            <span className={hide}>Collapse</span>
          </button>

          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setMenu(menu === "account" ? null : "account")}
              aria-expanded={menu === "account"}
              title={collapsed ? profile.display_name : undefined}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-sidebar-hover ${
                collapsed ? "md:justify-center md:px-0" : ""
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {profile.display_name?.charAt(0).toUpperCase() || "?"}
              </span>
              <span className={`min-w-0 flex-1 ${hide}`}>
                <span className="block truncate text-sm font-medium text-white">
                  {profile.display_name}
                </span>
                <span className="block text-xs capitalize text-sidebar-dim">
                  {profile.role}
                </span>
              </span>
              <ChevronsUpDownIcon
                size={16}
                className={`shrink-0 text-sidebar-dim ${hide}`}
              />
            </button>

            {menu === "account" && (
              <div
                className={`absolute bottom-full left-0 right-0 z-50 mb-2 rounded-lg border bg-white py-1 text-slate-700 shadow-lg ${
                  collapsed
                    ? "md:bottom-0 md:left-full md:right-auto md:mb-0 md:ml-2 md:w-56"
                    : ""
                }`}
              >
                {isAdmin && (
                  <Link
                    href="/admin/users"
                    onClick={closeAll}
                    className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-100"
                  >
                    <UsersIcon size={18} />
                    Manage users
                  </Link>
                )}
                <Link
                  href="/profile"
                  onClick={closeAll}
                  className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-100"
                >
                  <UserIcon size={18} />
                  Profile
                </Link>
                <form action={logout} className="border-t">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-100"
                  >
                    <LogoutIcon size={18} />
                    Log out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
