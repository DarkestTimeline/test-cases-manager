import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import AppSidebar from "@/components/AppSidebar";
import ThemeScript from "@/components/ThemeScript";
import ThemeSync from "@/components/ThemeSync";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Runs before first paint so the page never flashes the wrong theme: uses the
// saved choice, otherwise the operating system preference. (ThemeScript renders
// it into the server HTML only; see that component for why.)
const THEME_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )theme=(light|dark)/);var t=m?m[1]:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");if(t==="dark")document.documentElement.classList.add("dark");}catch(e){}})();`;

export const metadata = {
  title: { default: "QA Test Manager", template: "%s · QA Test Manager" },
  description: "Manual QA test case management",
};

export default async function RootLayout({ children }) {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? null;

  let profile = null;
  let projects = [];

  if (userId) {
    const [{ data: profileData }, { data: projectsData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, role")
        .eq("id", userId)
        .single(),
      supabase
        .from("projects")
        .select("code, name, archived_at")
        .order("name"),
    ]);
    profile = profileData;
    projects = projectsData || [];
  }

  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get("sidebar-collapsed")?.value === "1";
  // The saved theme is part of <html>'s own class list. If React ever rebuilds
  // the page root it re-applies these classes, so "dark" has to be among them.
  const isDark = cookieStore.get("theme")?.value === "dark";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${
        isDark ? " dark" : ""
      }`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript code={THEME_SCRIPT} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeSync />
        {profile ? (
          <AppSidebar
            profile={profile}
            projects={projects}
            defaultCollapsed={defaultCollapsed}
          >
            {children}
          </AppSidebar>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
