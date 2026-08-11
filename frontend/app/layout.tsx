import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Saira_Condensed } from "next/font/google";

import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const sairaCondensed = Saira_Condensed({
  variable: "--font-saira-condensed",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "IntelliConnect — Turn Every Conversation Into Action",
    template: "%s · IntelliConnect",
  },
  description:
    "AI-powered meeting intelligence for smarter conversations, clearer decisions, and accountable execution. Turn meeting transcripts into summaries, tasks, decisions, and professional reports.",
  keywords: [
    "meeting intelligence",
    "AI summaries",
    "meeting transcripts",
    "task extraction",
    "meeting reports",
  ],
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sairaCondensed.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: browser extensions (e.g. the cz-shortcut
          listener) inject attributes into <body> that the server HTML lacks. */}
      <body className="min-h-full" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
