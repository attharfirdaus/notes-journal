"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Nut, Sparkles, TriangleAlert } from "lucide-react";
import { quickAdd } from "@/actions/notes";
import { Button, Chip } from "@/components/ui";
import { usePrefs } from "@/components/prefs";
import { useToast } from "@/components/toast";
import { celebrate } from "@/lib/fx";
import { planQuickAdd } from "@/lib/quick-add";
import { NOTE_TYPES } from "@/lib/note-meta";
import { formatDue } from "@/lib/time";
import { Icon } from "@/lib/icons";

export function QuickAdd() {
  const router = useRouter();
  const prefs = usePrefs();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const plan = useMemo(() => planQuickAdd(text, prefs.timezone), [text, prefs.timezone]);

  const submit = () =>
    start(async () => {
      const res = await quickAdd(text);
      if (!res.ok) return toast({ icon: TriangleAlert, title: "Couldn't add", body: res.error });
      setText("");
      celebrate("small");
      toast({
        icon: Nut,
        title: `Tucked away: ${res.data.title}`,
        body: res.data.items > 1 ? `${res.data.items} items added` : "Tap to open",
        href: `/notes/${res.data.id}`,
      });
      router.refresh();
    });

  const meta = plan ? NOTE_TYPES.find((t) => t.value === plan.type) : null;

  return (
    <section className="rounded-blob border-2 border-line bg-card p-4 shadow-soft">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) submit();
        }}
        className="flex items-center gap-2"
      >
        <Sparkles className="shrink-0 text-primary" size={22} aria-hidden />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Quick add… “Groceries: milk, eggs” or “Essay due friday 5pm”"
          aria-label="Quick add"
          className="h-11 min-w-0 flex-1 bg-transparent text-[16px] font-semibold outline-none placeholder:font-normal placeholder:text-ink-soft/80"
        />
        <Button type="submit" loading={pending} disabled={!text.trim()}>
          Tuck it
        </Button>
      </form>
      <AnimatePresence>
        {plan && text.trim() ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-1.5 overflow-hidden pl-8 pt-2 text-sm"
          >
            <span className="text-xs font-bold text-ink-soft">Will create:</span>
            {meta ? (
              <Chip>
                <Icon name={meta.icon} size={13} className="mr-1 inline-block align-[-2px]" />
                {meta.label}
              </Chip>
            ) : null}
            <Chip>“{plan.title}”</Chip>
            {plan.items.length > 1 ? <Chip>{plan.items.length} items</Chip> : null}
            {plan.date ? <Chip> {formatDue(plan.date.iso, prefs.timezone)}</Chip> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
