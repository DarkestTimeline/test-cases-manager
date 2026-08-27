import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { supabase } from "@/lib/supabaseClient";
import StartRunButton from "@/components/StartRunButton";

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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="border-b p-4 flex gap-4 items-center">
          <Link href="/" className="font-medium hover:underline">
            Home
          </Link>
          <Link href="/test-cases" className="font-medium hover:underline">
            Test Cases
          </Link>
          <Link href="/modules" className="font-medium hover:underline">
            Modules
          </Link>
          <Link href="/suites" className="font-medium hover:underline">
            Suites
          </Link>
          <Link href="/runs" className="font-medium hover:underline">
            Runs
          </Link>
          <StartRunButton suites={suites || []} />
        </nav>
        {children}
      </body>
    </html>
  );
}
