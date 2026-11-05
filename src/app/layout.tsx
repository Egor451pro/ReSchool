import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "ReSchool",
  description: "Повторное использование школьного имущества через практику ПТО",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="border-b border-mint/50 bg-paper">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-6 py-3">
            <Link href="/" className="text-sm font-semibold tracking-wide text-ink">
              ReSchool
            </Link>
            <Link href="/login" className="text-sm font-medium text-leaf hover:text-ink">
              Войти
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
