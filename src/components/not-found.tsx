import Link from "next/link";
import { Mascot } from "@/components/mascot";

export function NotFound() {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-4 text-center">
      <Mascot stage="kit" mood="sad" size={140} label="A puzzled squirrel" />
      <h1 className="mt-3 font-display text-3xl font-bold">This acorn rolled away</h1>
      <p className="mt-2 max-w-sm text-ink-soft">
        The page you&apos;re looking for doesn&apos;t exist, or it was deleted.
      </p>
      <Link
        href="/home"
        className="btn-pop mt-5 rounded-btn bg-primary px-5 py-2.5 font-bold text-primary-ink"
      >
        Back to Home
      </Link>
    </div>
  );
}
