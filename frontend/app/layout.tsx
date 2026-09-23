import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
import "./globals.css";

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
  // The favicon is served by a dynamic route so the browser tab icon
  // follows the super-admin platform theme.
  icons: {
    icon: "/theme-icon",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: browser extensions (e.g. the cz-shortcut
          listener) inject attributes into <body> that the server HTML lacks. */}
      <body className="min-h-full" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
