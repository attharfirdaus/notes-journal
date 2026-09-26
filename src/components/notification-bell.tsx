"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { pollNotifications } from "@/actions/notifications";
import { useToast } from "./toast";
import { sfx } from "@/lib/fx";
import { usePrefs } from "./prefs";

const SEEN_KEY = "tb-seen-notifications";

function loadSeen(): Set<string> {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function NotificationBell({ variant }: { variant: "sidebar" | "floating" }) {
  const [unread, setUnread] = useState(0);
  const { toast } = useToast();
  const prefs = usePrefs();
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    seen.current = loadSeen();
    let alive = true;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await pollNotifications();
      if (!alive || !res.ok) return;
      setUnread(res.data.unread);
      const fresh = res.data.recent.filter((n) => !seen.current!.has(n.id));
      fresh.forEach((n) => {
        seen.current!.add(n.id);
        toast({ title: n.title, body: n.body, href: n.link ?? "/notifications" });
      });
      if (fresh.length && prefs.soundEffects) sfx.chime();
      try {
        sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen.current!].slice(-100)));
      } catch {}
    };
    void tick();
    const id = setInterval(tick, 60_000);
    const onVis = () => document.visibilityState === "visible" && void tick();
    const onRead = () => void tick();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("tb:notifications-changed", onRead);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("tb:notifications-changed", onRead);
    };
  }, [toast, prefs.soundEffects]);

  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
      className={clsx(
        "relative flex items-center gap-3 font-bold",
        variant === "sidebar"
          ? "rounded-2xl px-3 py-2.5 text-ink-soft hover:bg-soft hover:text-ink"
          : "h-11 w-11 justify-center rounded-full border-2 border-line bg-card shadow-soft",
      )}
    >
      <motion.span
        key={unread}
        animate={unread ? { rotate: [0, -18, 16, -10, 6, 0] } : undefined}
        transition={{ duration: 0.7 }}
        className="relative inline-flex"
      >
        <Bell size={20} />
        <AnimatePresence>
          {unread > 0 ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF5B5B] px-1 text-[11px] font-black text-white"
            >
              {unread > 99 ? "99+" : unread}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.span>
      {variant === "sidebar" ? <span>Inbox</span> : null}
    </Link>
  );
}
