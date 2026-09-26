"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { CheckCheck, Trash2, X } from "lucide-react";
import { clearNotifications, deleteNotification, markNotificationsRead } from "@/actions/notifications";
import { Button, EmptyState, IconButton } from "@/components/ui";
import { relativeFromNow } from "@/lib/time";
import type { AppNotification } from "@/lib/types";

const KIND_EMOJI = { reminder: "⏰", capsule: "💌", nudge: "📔", system: "🐿️" } as const;

export function NotificationList({ initial }: { initial: AppNotification[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [, start] = useTransition();
  const unread = items.filter((n) => !n.read_at).length;
  const changed = () => window.dispatchEvent(new Event("tb:notifications-changed"));

  const open = (n: AppNotification) => {
    if (!n.read_at) {
      setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      start(async () => {
        await markNotificationsRead(n.id);
        changed();
      });
    }
    if (n.link) router.push(n.link);
  };

  if (!items.length) {
    return (
      <EmptyState emoji="📭" title="All quiet here">
        Reminders for deadlines, unlocked time capsules and journal nudges will show up here.
      </EmptyState>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap justify-end gap-2">
        <Button
          size="sm"
          variant="soft"
          disabled={!unread}
          onClick={() =>
            start(async () => {
              setItems((xs) => xs.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
              await markNotificationsRead();
              changed();
            })
          }
        >
          <CheckCheck size={16} /> Mark all read
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            start(async () => {
              setItems([]);
              await clearNotifications();
              changed();
            })
          }
        >
          <Trash2 size={16} /> Clear all
        </Button>
      </div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {items.map((n) => (
            <motion.li
              key={n.id}
              layout
              exit={{ opacity: 0, x: 60 }}
              className={clsx(
                "flex items-start gap-3 rounded-2xl border-2 bg-card p-3 shadow-soft transition",
                n.read_at ? "border-line opacity-75" : "border-primary",
              )}
            >
              <button type="button" onClick={() => open(n)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                <span className="text-2xl">{KIND_EMOJI[n.kind]}</span>
                <span className="min-w-0">
                  <span className="block font-bold">{n.title}</span>
                  {n.body ? <span className="block text-sm text-ink-soft">{n.body}</span> : null}
                  <span className="mt-0.5 block text-xs text-ink-soft">{relativeFromNow(n.created_at)}</span>
                </span>
              </button>
              {!n.read_at ? <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread" /> : null}
              <IconButton
                label="Delete notification"
                className="h-8 w-8"
                onClick={() =>
                  start(async () => {
                    setItems((xs) => xs.filter((x) => x.id !== n.id));
                    await deleteNotification(n.id);
                    changed();
                  })
                }
              >
                <X size={16} />
              </IconButton>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
