import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import AppSidebar from "@/components/AppSidebar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "QA Test Manager",
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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {profile ? (
          <AppSidebar
            profile={profile}
            projects={projects}
            defaultCollapsed={defaultCollapsed}
          >
            {children}
          </AppSidebar>
        ) : (
          <>
            <header className="bg-white px-6 py-3 shadow-sm">
              <div className="max-w-6xl mx-auto">
                <span className="font-bold text-primary text-lg">
                  QA Test Manager
                </span>
              </div>
            </header>
            {children}
          </>
        )}
      </body>
    </html>
  );
}
