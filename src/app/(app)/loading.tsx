"use client";

import { usePathname } from "next/navigation";
import {
  CapsulesSkeleton, CategoriesSkeleton, FocusSkeleton, HomeSkeleton, JournalEntrySkeleton,
  JournalSkeleton, NoteDetailSkeleton, NotesSkeleton, NotificationsSkeleton, PageSkeleton,
  PixelsSkeleton, SettingsSkeleton,
} from "@/components/skeletons";

// One loading boundary for the whole app shell.
//
// Per-segment loading.tsx files cannot work here: every route reads cookies, so
// it is dynamic, and Next.js sends an empty prefetch payload for those. The
// segment's own fallback only arrives together with the content it was meant to
// cover. This boundary lives in the (app) layout instead, which the client
// already holds, so it paints immediately on click.
//
// The router commits the new URL before showing the fallback, so the pathname
// tells us which skeleton to draw.
const ROUTES: [RegExp, () => React.ReactElement][] = [
  [/^\/home$/, HomeSkeleton],
  [/^\/notes$/, NotesSkeleton],
  [/^\/notes\/[^/]+$/, NoteDetailSkeleton],
  [/^\/journal$/, JournalSkeleton],
  [/^\/journal\/[^/]+$/, JournalEntrySkeleton],
  [/^\/focus$/, FocusSkeleton],
  [/^\/pixels$/, PixelsSkeleton],
  [/^\/capsules$/, CapsulesSkeleton],
  [/^\/categories$/, CategoriesSkeleton],
  [/^\/notifications$/, NotificationsSkeleton],
  [/^\/settings$/, SettingsSkeleton],
];

export default function Loading() {
  const pathname = usePathname();
  const Skeleton = ROUTES.find(([re]) => re.test(pathname))?.[1] ?? PageSkeleton;
  return <Skeleton />;
}
