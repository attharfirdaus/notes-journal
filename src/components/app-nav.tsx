"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell, BookHeart, Ellipsis, Grid3x3, Hourglass, House, NotebookPen, Settings, Tags, Timer,
} from "lucide-react";
import { NotificationBell, useNotificationPoller } from "./notification-bell";
import { ServiceWorker } from "./service-worker";

const PRIMARY = [
  { href: "/home", label: "Home", icon: House },
  { href: "/notes", label: "Notes", icon: NotebookPen },
  { href: "/journal", label: "Journal", icon: BookHeart },
  { href: "/focus", label: "Focus", icon: Timer },
];
const SECONDARY = [
  { href: "/pixels", label: "Year in Pixels", icon: Grid3x3 },
  { href: "/capsules", label: "Time Capsules", icon: Hourglass },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

export function AppNav() {
  const path = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = SECONDARY.some((s) => isActive(path, s.href));
  const unread = useNotificationPoller();

  return (
    <>
      <ServiceWorker />
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r-2 border-line bg-card/70 p-4 backdrop-blur md:flex">
        <Link href="/home" className="mb-4 flex items-center gap-2 px-2 font-display text-2xl font-bold">
          <span className="wiggle-hover inline-block">🌰</span> Tuckbury
        </Link>
        {[...PRIMARY, ...SECONDARY].map((item) => {
          const active = isActive(path, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold transition",
                active ? "text-ink" : "text-ink-soft hover:bg-soft hover:text-ink",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl bg-primary/25"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              ) : null}
              <Icon size={20} className="relative" />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
        <div className="mt-auto">
          <NotificationBell variant="sidebar" unread={unread} />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b-2 border-line bg-card/90 px-4 backdrop-blur md:hidden"
        style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}
      >
        <Link href="/home" className="flex items-center gap-1.5 font-display text-xl font-bold">
          🌰 Tuckbury
        </Link>
        <NotificationBell variant="topbar" unread={unread} />
      </header>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-3 bottom-3 z-40 rounded-[1.75rem] border-2 border-line bg-card/95 px-2 py-1.5 shadow-soft backdrop-blur md:hidden"
        style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
        aria-label="Main"
      >
        <ul className="flex items-center justify-around">
          {PRIMARY.map((item) => {
            const active = isActive(path, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    "relative flex w-16 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold",
                    active ? "text-ink" : "text-ink-soft",
                  )}
                >
                  {active ? (
                    <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-2xl bg-primary/25" />
                  ) : null}
                  <Icon size={22} className="relative" />
                  <span className="relative">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className={clsx(
                "relative flex w-16 flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-bold",
                moreActive || moreOpen ? "text-ink" : "text-ink-soft",
              )}
            >
              {moreActive ? <span className="absolute inset-0 rounded-2xl bg-primary/25" /> : null}
              <Ellipsis size={22} className="relative" />
              <span className="relative">More</span>
            </button>
            {moreOpen ? (
              <>
                <button aria-label="Close menu" className="fixed inset-0 -z-10 cursor-default" onClick={() => setMoreOpen(false)} />
                <motion.ul
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute bottom-16 right-0 w-56 rounded-2xl border-2 border-line bg-card p-2 shadow-soft"
                >
                  {SECONDARY.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={clsx(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 font-bold",
                            isActive(path, item.href) ? "bg-primary/25" : "hover:bg-soft",
                          )}
                        >
                          <Icon size={18} /> {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </motion.ul>
              </>
            ) : null}
          </li>
        </ul>
      </nav>
    </>
  );
}
