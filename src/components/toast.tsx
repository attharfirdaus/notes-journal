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
        className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const inner = (
              <>
                {t.icon ? (
                  <span className="inline-flex shrink-0 rounded-xl bg-soft p-2 text-primary">
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
                initial={{ y: -30, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -20, opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="pointer-events-auto w-full max-w-sm"
                onClick={() => dismiss(t.id)}
              >
                {t.href ? (
                  <Link
                    href={t.href}
                    className="flex items-center gap-3 rounded-2xl border-2 border-line bg-card px-4 py-3 shadow-soft"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl border-2 border-line bg-card px-4 py-3 shadow-soft">
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
