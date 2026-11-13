import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Nunito } from "next/font/google";
import { getProfile } from "@/lib/auth";
import { themeCss } from "@/lib/themes";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

// See DESIGN.md: Fraunces for headings (album warmth), Caveat for margin notes, Nunito for reading.
const display = Fraunces({ variable: "--font-display-face", subsets: ["latin"], style: ["normal", "italic"] });
const hand = Caveat({ variable: "--font-hand-face", subsets: ["latin"], weight: ["600"] });
const body = Nunito({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Keepsake: keep it close, never forget", template: "%s · Keepsake" },
  description:
    "A scrapbook for your days: lists, reminders, a daily journal and a squirrel who keeps them with you.",
  applicationName: "Keepsake",
  appleWebApp: { capable: true, title: "Keepsake", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFF8E7" },
    { media: "(prefers-color-scheme: dark)", color: "#1F1A14" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const THEME_CSS = themeCss();

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();
  return (
    <html
      lang="en"
      data-theme={profile?.theme ?? "sunny"}
      data-mode={profile?.color_mode ?? "system"}
      data-reduce-motion={profile?.reduce_motion ? "true" : "false"}
      className={`${display.variable} ${hand.variable} ${body.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Static, author-controlled CSS (no user input). */}
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
      </head>
      <body className="min-h-full">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
