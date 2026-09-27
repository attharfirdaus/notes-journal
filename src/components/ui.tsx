"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import clsx from "clsx";
import {
  forwardRef,
  useEffect,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { Icon, type IconName } from "@/lib/icons";

type Variant = "primary" | "soft" | "ghost" | "danger" | "accent";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-primary-ink btn-pop",
  accent: "bg-accent text-ink btn-pop",
  soft: "bg-soft text-ink hover:brightness-95",
  ghost: "bg-transparent text-ink hover:bg-soft",
  danger: "bg-[#EF5B5B] text-white btn-pop",
};
const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-xl gap-1.5",
  md: "h-11 px-4 text-[15px] rounded-2xl gap-2",
  lg: "h-13 px-6 text-base rounded-2xl gap-2",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }
>(function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex select-none items-center justify-center font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
});

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={clsx(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-soft transition hover:bg-soft hover:text-ink disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }
>(function Input({ label, hint, className, id, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <label htmlFor={inputId} className="block">
      {label ? <span className="mb-1.5 block text-sm font-bold text-ink-soft">{label}</span> : null}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          "h-12 w-full rounded-2xl border-2 border-line bg-card px-4 text-[15px] text-ink placeholder:text-ink-soft/70 outline-none transition focus:border-primary",
          className,
        )}
        {...rest}
      />
      {hint ? <span className="mt-1 block text-xs text-ink-soft">{hint}</span> : null}
    </label>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        "w-full rounded-2xl border-2 border-line bg-card px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft/70 outline-none transition focus:border-primary",
        className,
      )}
      {...rest}
    />
  );
});

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("rounded-blob border-2 border-line bg-card p-5 shadow-soft", className)} {...rest}>
      {children}
    </div>
  );
}

export function Chip({
  children,
  color,
  active,
  onClick,
  onRemove,
  className,
  title,
}: {
  children: ReactNode;
  color?: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
  title?: string;
}) {
  const style = color ? { background: `${color}55`, borderColor: color } : undefined;
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={title}
      aria-pressed={onClick ? Boolean(active) : undefined}
      style={style}
      className={clsx(
        "inline-flex max-w-full items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-[13px] font-bold text-ink transition",
        !color && (active ? "border-primary bg-primary/25" : "border-line bg-soft"),
        onClick && "hover:-translate-y-0.5",
        className,
      )}
    >
      <span className="truncate">{children}</span>
      {onRemove ? (
        <span
          role="button"
          tabIndex={0}
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onRemove();
            }
          }}
          className="-mr-1 rounded-full p-0.5 hover:bg-black/10"
        >
          <X size={12} />
        </span>
      ) : null}
    </Tag>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl py-2 text-left"
    >
      <span>
        <span className="block font-bold">{label}</span>
        {description ? <span className="block text-sm text-ink-soft">{description}</span> : null}
      </span>
      <span
        className={clsx(
          "relative h-7 w-12 shrink-0 rounded-full border-2 transition",
          checked ? "border-primary bg-primary" : "border-line bg-soft",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-card shadow", checked ? "right-0.5" : "left-0.5")}
        />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-2xl bg-soft p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "relative flex-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition",
            value === o.value ? "text-ink" : "text-ink-soft hover:text-ink",
          )}
        >
          {value === o.value ? (
            <motion.span
              layoutId={`seg-${label}`}
              className="absolute inset-0 rounded-xl bg-card shadow"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          ) : null}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 60, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 60, scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className={clsx(
              "max-h-[90dvh] w-full overflow-y-auto rounded-t-[2rem] border-2 border-line bg-card p-5 shadow-soft sm:rounded-[2rem]",
              wide ? "sm:max-w-2xl" : "sm:max-w-md",
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">{title}</h2>
              <IconButton label="Close" onClick={onClose}>
                <X size={20} />
              </IconButton>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function ProgressBar({ value, className, color }: { value: number; className?: string; color?: string }) {
  return (
    <div className={clsx("h-3 w-full overflow-hidden rounded-full bg-soft", className)}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color ?? "var(--primary)" }}
        initial={false}
        animate={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-blob border-2 border-dashed border-line px-6 py-10 text-center">
      <motion.div
        className="rounded-3xl bg-soft p-4 text-ink-soft"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        <Icon name={icon} size={34} strokeWidth={2} />
      </motion.div>
      <p className="font-display text-lg font-bold">{title}</p>
      {children ? <div className="text-sm text-ink-soft">{children}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: IconName;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 className="flex items-center gap-2.5 font-display text-3xl font-bold tracking-tight">
        {icon ? (
          <span className="wiggle-hover inline-flex rounded-2xl bg-soft p-2 text-primary">
            <Icon name={icon} size={24} strokeWidth={2.5} />
          </span>
        ) : null}
        {title}
      </h1>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
