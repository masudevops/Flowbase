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

const description =
  "Flexible work management for projects, tasks, and workflows — built to adapt to how your team works.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://kelbara.com"),
  title: {
    default: "Kelbara",
    template: "%s · Kelbara",
  },
  description,
  openGraph: {
    title: "Kelbara",
    description,
    url: "/",
    siteName: "Kelbara",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kelbara",
    description,
  },
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
      <body className="flex min-h-full flex-col bg-[#F5F7F4] text-[#14242E] dark:bg-[#0B1F2E] dark:text-[#E7EEF0]">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
