"use client";

import { useEffect } from "react";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui";

/** Shared by the route error boundaries. `retry` re-renders the failed segment. */
export function ErrorView({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-4 text-center" role="alert">
      <Mascot stage="kit" mood="sad" size={130} label="A worried squirrel" />
      <h1 className="mt-3 font-display text-3xl font-bold">This page didn&apos;t load</h1>
      <p className="mt-2 max-w-sm text-ink-soft">
        Something went wrong while fetching it. Your notes are not affected. Check your connection and try again.
      </p>
      {error.digest ? <p className="mt-2 text-xs text-ink-soft">Reference: {error.digest}</p> : null}
      <Button className="mt-5" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
