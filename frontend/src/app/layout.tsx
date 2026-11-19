import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Inter is downloaded once at build time and served from our own site (no request to Google).
// "variable" makes it available as the CSS variable --font-inter, which globals.css uses.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// The mono face is used for code and for the numbers in the note under each reply.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Synoras AI",
  description: "An AI assistant that remembers, with project workspaces and your own documents.",
  // The browser-tab icon. public/icon.svg is the app icon (navy square with the mark).
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning // the theme script changes data-theme before React starts
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
