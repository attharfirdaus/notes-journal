import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { getProfile } from "@/lib/auth";
import { themeCss } from "@/lib/themes";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

const display = Fredoka({ variable: "--font-display-face", subsets: ["latin"], weight: ["500", "600", "700"] });
const body = Nunito({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Tuckbury: tuck it away, never forget", template: "%s · Tuckbury" },
  description:
    "A cozy note taker and daily journal with a squirrel sidekick. Lists, reminders, streaks, moods and tiny joys.",
  applicationName: "Tuckbury",
  appleWebApp: { capable: true, title: "Tuckbury", statusBarStyle: "default" },
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
      className={`${display.variable} ${body.variable} h-full antialiased`}
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
