"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

type Toast = { id: number; title: string; body?: string; icon?: LucideIcon; href?: string };
type ToastApi = { toast: (t: Omit<Toast, "id">) => void };

const ToastContext = createContext<ToastApi>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = next.current++;
      setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );
  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        // Bottom of the screen, clear of the page title: above the tab bar on a phone, bottom right on a desktop.
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-3 md:bottom-4 md:items-end md:px-4"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const inner = (
              <>
                {t.icon ? (
                  <span className="inline-flex shrink-0 text-primary-text">
                    <t.icon size={20} strokeWidth={2.5} aria-hidden />
                  </span>
                ) : null}
                <span className="min-w-0">
                  <span className="block font-bold">{t.title}</span>
                  {t.body ? <span className="block text-sm text-ink-soft">{t.body}</span> : null}
                </span>
              </>
            );
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="pointer-events-auto w-full max-w-sm"
                onClick={() => dismiss(t.id)}
              >
                {t.href ? (
                  <Link
                    href={t.href}
                    className="flex items-center gap-3 rounded-paper border border-edge bg-card px-4 py-3 shadow-lift"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-paper border border-edge bg-card px-4 py-3 shadow-lift">
                    {inner}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
