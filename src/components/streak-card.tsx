import { Snowflake } from "lucide-react";
import type { StreakInfo } from "@/lib/types";

const MILESTONES = [3, 7, 14, 30, 100, 365];

export function flameSize(streak: number) {
  const reached = MILESTONES.filter((m) => streak >= m).length;
  return 1 + reached * 0.18;
}

export function StreakCard({ streak }: { streak: StreakInfo }) {
  const next = MILESTONES.find((m) => m > streak.current);
  return (
    <div className="flex items-center gap-4 rounded-blob border-2 border-line bg-card p-4 shadow-soft">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center">
        <span
          className={streak.current ? "flame" : "grayscale opacity-50"}
          style={{ fontSize: `${2.2 * flameSize(streak.current)}rem`, lineHeight: 1 }}
          aria-hidden
        ></span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl font-bold leading-none">
          {streak.current} day{streak.current === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {streak.current === 0
            ? "Write today to start a streak!"
            : streak.wrote_today
              ? next
                ? `${next - streak.current} more to the ${next}-day badge`
                : "Legendary streak! "
              : "Write today to keep it going!"}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs font-bold text-ink-soft">
          <span>Best: {streak.longest}</span>
          <span
            className="inline-flex items-center gap-0.5"
            title="Streak freezes save your streak if you miss a single day. Earn one every 7 days."
          >
            <Snowflake size={13} /> {streak.freezes} freeze{streak.freezes === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
