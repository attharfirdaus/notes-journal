"use client";

import { useActionState, useEffect, useState, useTransition, type ReactNode } from "react";
import clsx from "clsx";
import { LogOut } from "lucide-react";
import { deleteAccount, signOut, updatePassword } from "@/actions/auth";
import { sendTestPush } from "@/actions/notifications";
import { updateProfile, type ProfilePatch } from "@/actions/settings";
import { Button, Chip, Input, Modal, Segmented, Switch } from "@/components/ui";
import { isIos, isStandalone, usePush } from "@/components/push";
import { useToast } from "@/components/toast";
import { REMINDER_PRESETS } from "@/lib/note-meta";
import { THEMES, VIBES } from "@/lib/themes";
import type { ColorMode, Profile } from "@/lib/types";

function Section({ title, emoji, children }: { title: string; emoji: string; children: ReactNode }) {
  return (
    <section className="rounded-[2rem] border-2 border-line bg-card p-5 shadow-soft">
      <h2 className="mb-4 font-display text-xl font-bold">
        {emoji} {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function SettingsForm({ profile, email }: { profile: Profile; email: string }) {
  const { toast } = useToast();
  const [p, setP] = useState(profile);
  const [zones, setZones] = useState<string[]>([profile.timezone]);
  const [, start] = useTransition();
  const push = usePush();

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setZones(Intl.supportedValuesOf("timeZone"));
    } catch {}
  }, []);

  const save = (patch: ProfilePatch, quiet = false) => {
    setP((x) => ({ ...x, ...patch }) as Profile);
    // Preview appearance instantly.
    const root = document.documentElement;
    if (patch.theme) root.dataset.theme = patch.theme;
    if (patch.color_mode) root.dataset.mode = patch.color_mode;
    if (patch.reduce_motion !== undefined) root.dataset.reduceMotion = String(patch.reduce_motion);
    start(async () => {
      const res = await updateProfile(patch);
      if (!res.ok) toast({ emoji: "😬", title: "Couldn't save", body: res.error });
      else if (!quiet) toast({ emoji: "✅", title: "Saved" });
    });
  };

  const [pwState, pwAction, pwPending] = useActionState(updatePassword, undefined);
  const [delState, delAction, delPending] = useActionState(deleteAccount, undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(p.display_name);
  const [pet, setPet] = useState(p.pet_name);

  return (
    <div className="space-y-5">
      <Section title="You & your sidekick" emoji="🐿️">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Your nickname" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onBlur={() => name !== p.display_name && save({ display_name: name })} />
          <Input
            label="Sidekick name"
            value={pet}
            maxLength={20}
            onChange={(e) => setPet(e.target.value)}
            onBlur={() => (pet.trim() ? pet !== p.pet_name && save({ pet_name: pet.trim() }) : setPet(p.pet_name))}
          />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">Time zone</span>
          <select
            value={p.timezone}
            onChange={(e) => save({ timezone: e.target.value })}
            className="h-12 w-full rounded-2xl border-2 border-line bg-card px-3 font-semibold outline-none focus:border-primary"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                {z.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-ink-soft">Used for streaks, reminders and “today”.</span>
        </label>
      </Section>

      <Section title="Look & feel" emoji="🎨">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => save({ theme: t.id }, true)}
              aria-pressed={p.theme === t.id}
              className={clsx("rounded-2xl border-2 p-3 text-left transition hover:-translate-y-0.5", p.theme === t.id ? "border-primary ring-2 ring-primary" : "border-line")}
              style={{ background: t.light.bg }}
            >
              <div className="flex gap-1">
                {[t.light.primary, t.light.accent, t.light.pet, t.dark.bg].map((c) => (
                  <span key={c} className="h-5 w-5 rounded-full border border-black/10" style={{ background: c }} />
                ))}
              </div>
              <div className="mt-2 text-sm font-bold" style={{ color: t.light.ink }}>
                {t.emoji} {t.name}
              </div>
            </button>
          ))}
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">Mode</span>
          <Segmented<ColorMode>
            label="Color mode"
            value={p.color_mode}
            onChange={(v) => save({ color_mode: v }, true)}
            options={[
              { value: "light", label: "☀️ Light" },
              { value: "dark", label: "🌙 Dark" },
              { value: "system", label: "💻 Auto" },
            ]}
          />
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">Background vibe</span>
          <div className="flex flex-wrap gap-2">
            {VIBES.map((v) => (
              <Chip key={v.id} active={p.vibe === v.id} onClick={() => save({ vibe: v.id }, true)}>
                {v.emoji} {v.name}
              </Chip>
            ))}
          </div>
        </div>
        <Switch label="Reduce motion" description="Turns off background animations and most movement." checked={p.reduce_motion} onChange={(v) => save({ reduce_motion: v }, true)} />
        <Switch label="Sound effects" description="Little pops and chimes when you check things off." checked={p.sound_effects} onChange={(v) => save({ sound_effects: v }, true)} />
      </Section>

      <Section title="Reminders" emoji="⏰">
        <div>
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">For tasks with a deadline, remind me…</span>
          <div className="flex flex-wrap gap-1.5">
            {REMINDER_PRESETS.map((r) => {
              const on = p.reminder_defaults.includes(r.value);
              return (
                <Chip
                  key={r.value}
                  active={on}
                  onClick={() => {
                    const next = on ? p.reminder_defaults.filter((x) => x !== r.value) : [...p.reminder_defaults, r.value];
                    if (next.length > 5) return toast({ emoji: "✋", title: "Up to 5 reminders" });
                    save({ reminder_defaults: next }, true);
                  }}
                >
                  {r.label}
                </Chip>
              );
            })}
          </div>
          <span className="mt-1 block text-xs text-ink-soft">Applies to new and updated tasks. You can override per item.</span>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold text-ink-soft">For schedule items (events), remind me</span>
          <select
            value={p.schedule_reminder}
            onChange={(e) => save({ schedule_reminder: Number(e.target.value) }, true)}
            className="h-11 rounded-2xl border-2 border-line bg-card px-3 font-semibold outline-none focus:border-primary"
          >
            {REMINDER_PRESETS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Switch
            label="Daily journal nudge"
            description="A gentle ping if you haven't written yet."
            checked={Boolean(p.journal_nudge_time)}
            onChange={(v) => save({ journal_nudge_time: v ? "20:00" : null })}
          />
          {p.journal_nudge_time ? (
            <input
              type="time"
              value={p.journal_nudge_time.slice(0, 5)}
              onChange={(e) => e.target.value && save({ journal_nudge_time: e.target.value }, true)}
              className="h-11 rounded-2xl border-2 border-line bg-card px-3 font-bold outline-none focus:border-primary"
              aria-label="Nudge time"
            />
          ) : null}
        </div>

        <div className="rounded-2xl bg-soft p-4">
          <p className="font-bold">📲 Push notifications on this device</p>
          <p className="mt-1 text-sm text-ink-soft">
            {push.state === "subscribed"
              ? "On. You'll get reminders even when Tuckbury is closed."
              : push.state === "denied"
                ? "Blocked in your browser settings. Allow notifications for this site to turn them on."
                : push.state === "unsupported"
                  ? isIos() && !isStandalone()
                    ? "On iPhone/iPad: tap Share → “Add to Home Screen”, open Tuckbury from there, then turn this on."
                    : "This browser doesn't support push notifications. In-app reminders still work."
                  : push.state === "unconfigured"
                    ? "Push isn't configured on the server yet (VAPID keys missing). In-app reminders still work."
                    : "Off. In-app reminders still work while Tuckbury is open."}
          </p>
          {push.error ? <p className="mt-1 text-sm font-bold text-[#EF5B5B]">{push.error}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            {push.state === "subscribed" ? (
              <>
                <Button
                  size="sm"
                  variant="soft"
                  onClick={async () => {
                    const res = await sendTestPush();
                    toast(res.ok ? { emoji: "📨", title: `Test sent to ${res.data.sent} device(s)` } : { emoji: "😬", title: "Test failed", body: res.error });
                  }}
                >
                  Send test
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void push.unsubscribe()} loading={push.busy}>
                  Turn off
                </Button>
              </>
            ) : push.state === "default" ? (
              <Button size="sm" onClick={() => void push.subscribe()} loading={push.busy}>
                Turn on
              </Button>
            ) : null}
          </div>
        </div>
      </Section>

      <Section title="Account" emoji="🔐">
        <p className="text-sm">
          Signed in as <span className="font-bold">{email}</span>
        </p>
        <form action={pwAction} className="space-y-3">
          <p className="font-bold">Change password</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="password" type="password" placeholder="New password" autoComplete="new-password" minLength={8} required aria-label="New password" />
            <Input name="confirm" type="password" placeholder="Confirm" autoComplete="new-password" minLength={8} required aria-label="Confirm password" />
          </div>
          {pwState?.error ? <p className="text-sm font-bold text-[#EF5B5B]">{pwState.error}</p> : null}
          {pwState?.message ? <p className="text-sm font-bold">{pwState.message}</p> : null}
          <Button type="submit" size="sm" variant="soft" loading={pwPending}>
            Update password
          </Button>
        </form>
        <div className="flex flex-wrap gap-2 border-t-2 border-line pt-4">
          <form action={signOut}>
            <Button type="submit" variant="soft">
              <LogOut size={16} /> Log out
            </Button>
          </form>
          <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-[#C0392B] dark:text-[#FF8A80]">
            Delete account
          </Button>
        </div>
      </Section>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete your account? 😢">
        <form action={delAction} className="space-y-4">
          <p className="text-ink-soft">
            This permanently deletes your notes, journal, capsules and everything else. {p.pet_name} will miss you.
          </p>
          <Input name="confirm" label='Type "DELETE" to confirm' autoComplete="off" required />
          {delState?.error ? <p className="text-sm font-bold text-[#EF5B5B]">{delState.error}</p> : null}
          <Button type="submit" variant="danger" className="w-full" loading={delPending}>
            Delete everything
          </Button>
        </form>
      </Modal>
    </div>
  );
}
