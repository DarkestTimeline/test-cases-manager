import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { supabase } from "@/lib/supabaseClient";
import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "QA Test Manager",
  description: "Manual QA test case management",
};

export default async function RootLayout({ children }) {
  const { data: suites } = await supabase
    .from("suites")
    .select("*")
    .is("archived_at", null)
    .order("name");

  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabaseAuth
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NavBar suites={suites || []} profile={profile} />
        {children}
      </body>
    </html>
  );
}
