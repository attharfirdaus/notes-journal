"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  AlarmClock,
  Check,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
  TriangleAlert,
  Volume2,
  VolumeX,
} from "lucide-react";
import { saveFocusSession } from "@/actions/focus";
import { updateItem } from "@/actions/notes";
import { Mascot } from "@/components/mascot";
import { Button, IconButton, Segmented } from "@/components/ui";
import { useToast } from "@/components/toast";
import { AmbientEngine, LAYERS, type LayerId } from "@/lib/ambient";
import { celebrate } from "@/lib/fx";
import type { PetMood, PetStage } from "@/lib/pet";

type Mode = "focus" | "short" | "long";
type Durations = Record<Mode, number>;
const DEFAULTS: Durations = { focus: 25, short: 5, long: 15 };
const SETTINGS_KEY = "tb-focus-settings";
const MODE_META: Record<Mode, { label: string; color: string; line: string }> = {
  focus: { label: "Focus", color: "var(--primary)", line: "Deep breath. One thing at a time." },
  short: { label: "Short break", color: "var(--accent)", line: "Stretch, sip some water, look outside." },
  long: { label: "Long break", color: "var(--pet)", line: "You earned a proper rest!" },
};

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function FocusTimer({
  tasks,
  focusToday,
  petName,
  stage,
  mood,
}: {
  tasks: { id: string; text: string; note: string }[];
  focusToday: number;
  petName: string;
  stage: PetStage;
  mood: PetMood;
}) {
  const { toast } = useToast();
  const [durations, setDurations] = useState<Durations>(DEFAULTS);
  const [mode, setMode] = useState<Mode>("focus");
  const [remaining, setRemaining] = useState(DEFAULTS.focus * 60000);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [minutesToday, setMinutesToday] = useState(focusToday);
  const [taskId, setTaskId] = useState<string>("");
  const [justFinished, setJustFinished] = useState(false);
  const [volumes, setVolumes] = useState<Record<LayerId, number>>({ rain: 0, wind: 0, brown: 0, pink: 0, white: 0 });
  const [soundOn, setSoundOn] = useState(false);
  const engine = useRef<AmbientEngine | null>(null);

  // Restore saved durations after mount (localStorage is client-only).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null") as Durations | null;
      if (saved?.focus) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDurations(saved);
        setRemaining(saved.focus * 60000);
      }
    } catch {}
    return () => engine.current?.close();
  }, []);

  const running = endsAt !== null;
  const total = durations[mode] * 60000;

  const ensureEngine = () => {
    engine.current ??= new AmbientEngine();
    void engine.current.resume();
    return engine.current;
  };

  const switchMode = useCallback(
    (m: Mode) => {
      setMode(m);
      setEndsAt(null);
      setStartedAt(null);
      setRemaining(durations[m] * 60000);
    },
    [durations],
  );

  const finish = useCallback(async () => {
    setEndsAt(null);
    setRemaining(0);
    ensureEngine().chime();
    if (mode === "focus") {
      const minutes = durations.focus;
      setMinutesToday((m) => m + minutes);
      setRound((r) => r + 1);
      setJustFinished(true);
      celebrate("big");
      toast({ icon: Timer, title: `${minutes} focused minutes!`, body: `${petName} is impressed. Time for a break.` });
      if (document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
        new Notification(" Focus session complete!", { body: "Take a break. You earned it.", icon: "/icons/192" });
      }
      const res = await saveFocusSession({
        started_at: startedAt ?? new Date(Date.now() - minutes * 60000).toISOString(),
        duration_min: minutes,
        item_id: taskId || null,
      });
      if (!res.ok) toast({ icon: TriangleAlert, title: "Session not saved", body: res.error });
      const nextMode: Mode = (round + 1) % 4 === 0 ? "long" : "short";
      setMode(nextMode);
      setRemaining(durations[nextMode] * 60000);
    } else {
      toast({ icon: AlarmClock, title: "Break's over!", body: "Ready for another round?" });
      if (document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
        new Notification("⏰ Break's over!", { body: "Ready for another round?", icon: "/icons/192" });
      }
      setMode("focus");
      setRemaining(durations.focus * 60000);
    }
    setStartedAt(null);
  }, [mode, durations, startedAt, taskId, round, petName, toast]);

  // Timestamp-based ticking stays accurate in background tabs.
  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const left = endsAt - Date.now();
      if (left <= 0) void finish();
      else setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt, finish]);

  useEffect(() => {
    document.title = running ? `${fmt(remaining)} · ${MODE_META[mode].label}` : "Focus · Tuckbury";
  }, [running, remaining, mode]);

  const toggle = () => {
    ensureEngine();
    setJustFinished(false);
    if (running) {
      setRemaining(endsAt - Date.now());
      setEndsAt(null);
    } else {
      if (remaining <= 0) setRemaining(total);
      setEndsAt(Date.now() + (remaining > 0 ? remaining : total));
      setStartedAt((s) => s ?? new Date().toISOString());
      if ("Notification" in window && Notification.permission === "default") void Notification.requestPermission();
    }
  };

  const setVolume = (id: LayerId, v: number) => {
    setVolumes((vs) => ({ ...vs, [id]: v }));
    const e = ensureEngine();
    if (!soundOn && v > 0) setSoundOn(true);
    e.setVolume(id, soundOn || v > 0 ? v : 0);
  };

  const toggleSound = () => {
    const e = ensureEngine();
    const next = !soundOn;
    setSoundOn(next);
    if (next) {
      // Nothing chosen yet? Start with gentle rain.
      const any = Object.values(volumes).some((v) => v > 0);
      const vs = any ? volumes : { ...volumes, rain: 0.5 };
      if (!any) setVolumes(vs);
      (Object.keys(vs) as LayerId[]).forEach((id) => e.setVolume(id, vs[id]));
    } else {
      (Object.keys(volumes) as LayerId[]).forEach((id) => e.setVolume(id, 0));
    }
  };

  const saveDurations = (d: Durations) => {
    setDurations(d);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(d));
    } catch {}
    if (!running) setRemaining(d[mode] * 60000);
  };

  const progress = 1 - remaining / total;
  const R = 108;
  const C = 2 * Math.PI * R;
  const task = tasks.find((t) => t.id === taskId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      <section className="flex flex-col items-center rounded-[2rem] border-2 border-line bg-card p-5 shadow-soft">
        <div className="w-full max-w-sm">
          <Segmented<Mode>
            label="Timer mode"
            value={mode}
            onChange={switchMode}
            options={(Object.keys(MODE_META) as Mode[]).map((m) => ({ value: m, label: MODE_META[m].label }))}
          />
        </div>

        <div className="relative my-6 h-64 w-64">
          <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx={120} cy={120} r={R} fill="none" stroke="var(--soft)" strokeWidth={16} />
            <motion.circle
              cx={120}
              cy={120}
              r={R}
              fill="none"
              stroke={MODE_META[mode].color}
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={C}
              animate={{ strokeDashoffset: C * (1 - Math.max(0, Math.min(1, progress))) }}
              transition={{ duration: 0.3, ease: "linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-6xl font-bold tabular-nums" role="timer" aria-live="off">
              {fmt(remaining)}
            </span>
            <span className="mt-1 text-sm font-bold text-ink-soft">{MODE_META[mode].label}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <IconButton
            label="Reset"
            onClick={() => {
              setEndsAt(null);
              setStartedAt(null);
              setRemaining(total);
            }}
          >
            <RotateCcw size={20} />
          </IconButton>
          <Button size="lg" onClick={toggle} className="w-40">
            {running ? <Pause size={20} /> : <Play size={20} />}{" "}
            {running ? "Pause" : remaining < total && remaining > 0 ? "Resume" : "Start"}
          </Button>
          <IconButton
            label={mode === "focus" ? "Skip to break (not counted)" : "Skip break"}
            onClick={() => switchMode(mode === "focus" ? ((round + 1) % 4 === 0 ? "long" : "short") : "focus")}
          >
            <SkipForward size={20} />
          </IconButton>
        </div>

        <p className="mt-4 text-center text-sm text-ink-soft">{MODE_META[mode].line}</p>

        <div className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-soft p-3">
          <Mascot stage={stage} mood={running ? "happy" : justFinished ? "ecstatic" : mood} size={70} label={petName} />
          <div className="text-sm">
            <p className="font-bold">
              Today: {minutesToday} min · × {round}
            </p>
            <p className="text-ink-soft">
              {running
                ? `${petName} is focusing with you…`
                : justFinished
                  ? `${petName} cheers! `
                  : `${petName} is ready when you are.`}
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        <section className="rounded-[2rem] border-2 border-line bg-card p-5 shadow-soft">
          <h2 className="mb-2 font-display text-lg font-bold"> Working on</h2>
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="h-11 w-full rounded-2xl border-2 border-line bg-card px-3 font-semibold outline-none focus:border-primary"
            aria-label="Link a task"
          >
            <option value="">Nothing specific</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.text} · {t.note}
              </option>
            ))}
          </select>
          {task && justFinished ? (
            <Button
              variant="soft"
              className="mt-3 w-full"
              onClick={async () => {
                const res = await updateItem(task.id, { is_done: true });
                if (!res.ok) return toast({ icon: TriangleAlert, title: "Couldn't update", body: res.error });
                celebrate("small");
                toast({ icon: Check, title: `Done: ${task.text}` });
                setTaskId("");
              }}
            >
              Mark “{task.text}” as done
            </Button>
          ) : null}
        </section>

        <section className="rounded-[2rem] border-2 border-line bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold"> Ambience</h2>
            <Button size="sm" variant={soundOn ? "primary" : "soft"} onClick={toggleSound}>
              {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />} {soundOn ? "On" : "Off"}
            </Button>
          </div>
          <div className="space-y-3">
            {LAYERS.map((l) => (
              <label key={l.id} className="flex items-center gap-3">
                <span
                  className={clsx(
                    "flex w-28 shrink-0 items-center gap-1.5 text-sm font-bold",
                    volumes[l.id] > 0 && soundOn ? "text-ink" : "text-ink-soft",
                  )}
                >
                  <l.Icon size={15} aria-hidden /> {l.label}
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volumes[l.id]}
                  onChange={(e) => setVolume(l.id, Number(e.target.value))}
                  className="flex-1 accent-[var(--primary)]"
                  aria-label={`${l.label} volume`}
                />
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            All sounds are generated live in your browser. Mix your own soundscape.
          </p>
        </section>

        <section className="rounded-[2rem] border-2 border-line bg-card p-5 shadow-soft">
          <h2 className="mb-3 font-display text-lg font-bold"> Durations (minutes)</h2>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(MODE_META) as Mode[]).map((m) => (
              <label key={m} className="text-sm font-bold text-ink-soft">
                {MODE_META[m].label}
                <input
                  type="number"
                  min={1}
                  max={m === "focus" ? 180 : 60}
                  value={durations[m]}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(m === "focus" ? 180 : 60, Number(e.target.value) || 1));
                    saveDurations({ ...durations, [m]: v });
                  }}
                  className="mt-1 h-10 w-full rounded-xl border-2 border-line bg-card px-2 text-center font-bold text-ink outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
