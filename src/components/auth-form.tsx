"use client";

import { startTransition, useActionState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { FormState } from "@/actions/auth";
import { Button } from "./ui";

export function AuthForm({
  action,
  submitLabel,
  children,
  footer,
  hideOnSuccess,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  footer?: ReactNode;
  hideOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const done = hideOnSuccess && state?.message;
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        // Submit manually so React doesn't reset the fields (keeps the email after a typo'd password).
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="space-y-4"
    >
      {!done ? children : null}
      <AnimatePresence mode="wait">
        {state?.error ? (
          <motion.p
            key={state.error}
            role="alert"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }}
            className="rounded-2xl bg-[#EF5B5B]/15 px-4 py-2.5 text-sm font-bold text-ink"
          >
            {state.error}
          </motion.p>
        ) : null}
        {state?.message ? (
          <motion.p
            key={state.message}
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-primary/20 px-4 py-3 text-sm font-bold"
          >
            {state.message}
          </motion.p>
        ) : null}
      </AnimatePresence>
      {!done ? (
        <Button type="submit" loading={pending} className="w-full" size="lg">
          {submitLabel}
        </Button>
      ) : null}
      {footer ? <div className="pt-1 text-center text-sm text-ink-soft">{footer}</div> : null}
    </form>
  );
}
