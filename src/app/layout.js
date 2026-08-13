import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

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
  description: "Manual QA test case management"
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="border-b p-4 flex gap-4">
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
          <Link href="/runs/new" className="font-medium hover:underline">
            Start Run
          </Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
