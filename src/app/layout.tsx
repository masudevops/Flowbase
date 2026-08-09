import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import { TRPCProvider } from "@/trpc/Provider";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kelbara",
  description:
    "Flexible work management for projects, tasks, and workflows — built to adapt to how your team works.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The theme-init script below mutates the class list before React
      // hydrates, on purpose — the one-time mismatch that would otherwise
      // trigger a hydration warning here is expected, not a bug.
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body className="flex min-h-full flex-col bg-[#F7F9FC] text-[#172B4D] dark:bg-[#0E1624] dark:text-[#E4E7EC]">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
