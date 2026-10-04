import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { ThemeProvider } from "@/components/theme-provider";
import { SessionProviderWrapper } from "@/components/session-provider-wrapper";

import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cobbins AI — Find it. Reference it. Build it.",
  description:
    "Search real web-app interfaces, collect visual references, and generate production-ready React interfaces with AI.",
  applicationName: "Cobbins AI",
  icons: {
    icon: [
      { url: "/black-logo.png", media: "(prefers-color-scheme: light)" },
      { url: "/white-logo.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/black-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0f" },
  ],
};

const themeScript = `
  try {
    const saved = localStorage.getItem('cobbins-theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved === 'light' || saved === 'dark' ? saved : (systemDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable}`}>
        <Script
          id="cobbins-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <SessionProviderWrapper>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
