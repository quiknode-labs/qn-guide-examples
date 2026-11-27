// Small UI kit for the dashboard. Styles come from the tokens in app.css.
import {
  createContext, useContext, useEffect, useState, useSyncExternalStore,
  type ReactNode, type KeyboardEvent, type ElementType,
} from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Feedback = "info" | "success" | "warning" | "error";
const FEEDBACK_BG: Record<Feedback, string> = {
  info: "bg-(--info)",
  success: "bg-(--success)",
  warning: "bg-(--warning)",
  error: "bg-(--error)",
};

// ---- layout and type ----------------------------------------------------------------------

const PANEL_PADDING = { none: "", sm: "p-2", base: "p-4", lg: "p-8" } as const;

/** Square surface with a 1px border. `ink` draws the dark frame with a 4px bottom edge. */
export function Panel({ size = "base", ink = false, className, children }: {
  size?: keyof typeof PANEL_PADDING;
  ink?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-start border bg-(--background) text-left",
        ink ? "border-(--foreground) border-b-4" : "border-(--border)",
        PANEL_PADDING[size],
        className,
      )}
    >
      {children}
    </div>
  );
}

const HEADING_SIZES = { 1: "text-4xl lg:text-5xl", 2: "text-4xl lg:text-5xl", 3: "text-2xl lg:text-3xl", 4: "text-xl lg:text-2xl", 5: "text-lg lg:text-xl", 6: "text-base lg:text-lg" } as const;
const FIXED_SIZES = { lg: "text-lg", xl: "text-xl", "2xl": "text-2xl", "3xl": "text-3xl" } as const;

export function Heading({ level = 2, size, className, children }: {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: keyof typeof FIXED_SIZES;
  className?: string;
  children: ReactNode;
}) {
  const Tag = `h${level}` as ElementType;
  return <Tag className={cn("text-(--foreground)", size ? FIXED_SIZES[size] : HEADING_SIZES[level], className)}>{children}</Tag>;
}

/** Quicknode symbol. Inherits the text color. */
export function Logo({ className, ...rest }: { className?: string; "aria-label"?: string }) {
  return (
    <svg viewBox="0 0 372 348" className={className} role="img" {...rest}>
      <path
        d="M187.182 24.1917C274.752 25.1179 345.454 96.3928 345.454 184.182C345.454 224.995 330.172 262.238 305.019 290.503C302.414 293.432 303.045 298.067 306.44 300.027L374.455 339.295V344.182H183.738C183.735 344.182 183.733 344.179 183.733 344.176C183.732 344.173 183.73 344.171 183.727 344.171C96.1573 343.245 25.4543 271.971 25.4543 184.182C25.4543 143.369 40.7361 106.125 65.8889 77.8596C68.4945 74.9312 67.8636 70.2961 64.469 68.3362L-3.54468 29.0686V24.1819H187.172L187.182 24.1917ZM185.454 70.1819C122.494 70.1821 71.4543 121.222 71.4543 184.182C71.4543 247.142 122.494 298.182 185.454 298.182C248.415 298.182 299.454 247.142 299.454 184.182C299.454 121.221 248.415 70.1819 185.454 70.1819Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ---- labels and status --------------------------------------------------------------------

/** Mono uppercase marker. String children get the "// " prefix. */
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex w-fit items-center px-2 py-1 font-mono text-xs uppercase whitespace-nowrap text-(--foreground-light) ring-1 ring-(--border) ring-inset", className)}>
      {typeof children === "string" ? <><span aria-hidden="true">//&nbsp;</span>{children}</> : children}
    </span>
  );
}

/** Mono label for qualifiers and filter chips. `onDismiss` adds a remove button. */
export function Tag({ label, size = "xsm", leftAccessory, onDismiss, className }: {
  label: string;
  size?: "xsm" | "sm";
  leftAccessory?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center bg-(--background-elevated) font-mono uppercase whitespace-nowrap text-(--foreground) ring-1 ring-(--border) ring-inset",
        size === "sm" ? "gap-1.5 px-2 py-1 text-sm" : "gap-1 px-1 text-xs",
        className,
      )}
    >
      {leftAccessory}
      {label}
      {onDismiss ? (
        <button type="button" onClick={onDismiss} aria-label={`Remove ${label}`} className="cursor-pointer px-0.5 leading-none text-(--foreground-medium) hover:text-(--foreground)">
          ×
        </button>
      ) : null}
    </span>
  );
}

/** One state for one object, on a feedback fill. */
export function Status({ variant = "info", label, size = "xsm" }: { variant?: Feedback; label: string; size?: "xsm" | "sm" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-(--feedback-foreground) whitespace-nowrap text-(--feedback-foreground)",
        FEEDBACK_BG[variant],
        size === "sm" ? "h-6 px-2 text-sm" : "h-4 px-1 text-xs",
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 bg-(--feedback-foreground)" />
      {label}
    </span>
  );
}

/** Inline feedback banner with a hatch strip along the bottom. */
export function Message({ variant = "info", title, description }: { variant?: Feedback; title?: string; description?: string }) {
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex flex-col text-(--feedback-foreground)", FEEDBACK_BG[variant])}>
      <div className="border border-(--feedback-foreground) px-3 py-3 text-sm">
        {title ? <span className="mr-1 font-semibold">{title}</span> : null}
        {description}
      </div>
      <div aria-hidden="true" className="xs-hatch h-1 border-x border-b border-(--feedback-foreground)" />
    </div>
  );
}

export function Loader({ label = "Loading", size = "xsm" }: { label?: string; size?: "xsm" | "base" }) {
  return (
    <span role="status" aria-label={label} className={cn("xs-loader inline-flex items-center gap-0.5", size === "base" && "border border-(--foreground) bg-(--background-elevated) p-2")}>
      <span className="h-1.5 w-1.5 bg-(--foreground)" />
      <span className="h-1.5 w-1.5 bg-(--foreground)" />
      <span className="h-1.5 w-1.5 bg-(--foreground)" />
    </span>
  );
}

/** Determinate bar: hatched track, solid fill. */
export function Progress({ value, max = 100, ...rest }: { value: number; max?: number; "aria-label"?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} {...rest} className="xs-hatch relative h-2 w-full border border-(--foreground) text-(--grid)">
      {pct > 0 ? <div className="absolute inset-y-[-1px] left-[-1px] border border-(--foreground) bg-(--foreground)" style={{ width: `calc(${pct}% + 2px)` }} /> : null}
    </div>
  );
}

/** A figure that slides into place when it changes. Pass a preformatted string. */
export function RollingNumber({ children }: { children: string }) {
  return (
    <span className="inline-block overflow-hidden align-bottom">
      <span key={children} className="xs-roll">{children}</span>
    </span>
  );
}

// ---- controls -----------------------------------------------------------------------------

export function Button({ variant = "primary", type = "button", onClick, children, className }: {
  variant?: "primary" | "secondary" | "link";
  type?: "button" | "submit";
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center whitespace-nowrap transition-colors",
        variant === "link"
          ? "text-sm text-(--foreground) underline decoration-(--foreground-light) underline-offset-4 hover:decoration-(--foreground)"
          : "h-8 px-3 font-mono text-xs uppercase",
        variant === "primary" && "bg-(--background-inverted) text-(--foreground-inverted)",
        variant === "secondary" && "bg-(--background) text-(--foreground) ring-1 ring-(--foreground) ring-inset hover:bg-(--hover)",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Label above a control. The <label> wraps the control, so they are linked without ids. */
export function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-1.5 text-sm text-(--foreground)", className)}>
      <span>{label}</span>
      {children}
    </label>
  );
}

const CONTROL =
  "h-8 w-full border border-(--border) bg-(--background) px-3 text-sm text-(--foreground) shadow-[0_1px_0_0_var(--border)] outline-none transition-colors hover:border-(--foreground-light) focus:border-(--foreground) focus:shadow-[0_2px_0_0_var(--accent)]";

export function TextInput({ value, onValueChange, ...rest }: {
  value: string;
  onValueChange: (value: string) => void;
  type?: "text" | "number";
  inputMode?: "numeric" | "decimal" | "text";
  placeholder?: string;
  min?: number;
  step?: number;
  spellCheck?: boolean;
}) {
  return <input {...rest} value={value} onChange={(event) => onValueChange(event.target.value)} className={cn(CONTROL, "placeholder:text-(--foreground-light)")} />;
}

export interface SelectItem { value: string; label: string; secondaryLabel?: string }

/** Native select, styled to match the text input. */
export function Select({ items, value, onValueChange, placeholder, ...rest }: {
  items: SelectItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
}) {
  return (
    <span className="relative block w-full">
      <select {...rest} value={value} onChange={(event) => onValueChange(event.target.value)} className={cn(CONTROL, "cursor-pointer appearance-none pr-8")}>
        {placeholder ? <option value="" disabled>{placeholder}</option> : null}
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.secondaryLabel ? `${item.label} · ${item.secondaryLabel}` : item.label}
          </option>
        ))}
      </select>
      <svg aria-hidden="true" viewBox="0 0 10 6" className="pointer-events-none absolute top-1/2 right-3 h-1.5 w-2.5 -translate-y-1/2 text-(--foreground)">
        <path d="M0 0 L5 6 L10 0" fill="none" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    </span>
  );
}

/** Tab strip for peer views. Controlled: the parent owns `active`. Arrow keys move between tabs. */
export function TabController({ tabs, active, onChange, ...rest }: {
  tabs: string[];
  active: number;
  onChange: (index: number) => void;
  "aria-label"?: string;
}) {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    onChange((active + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length);
  };
  return (
    <div role="tablist" {...rest} onKeyDown={onKeyDown} className="flex border-b border-(--border)">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={index === active}
          tabIndex={index === active ? 0 : -1}
          onClick={() => onChange(index)}
          className={cn(
            "h-8 cursor-pointer px-3 font-mono text-xs uppercase whitespace-nowrap text-(--foreground)",
            index === active ? "xs-selected-fade" : "hover:bg-(--hover)",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ---- table --------------------------------------------------------------------------------

const RowPress = createContext<((value: string) => void) | undefined>(undefined);
type Align = "left" | "right" | "center";
const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

function TableRoot({ onRowPress, className, children }: { onRowPress?: (value: string) => void; hasBorder?: boolean; className?: string; children: ReactNode }) {
  return (
    <RowPress.Provider value={onRowPress}>
      <table className={cn("w-full border-collapse text-(--foreground)", className)}>{children}</table>
    </RowPress.Provider>
  );
}

function Header({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  );
}

function Column({ align = "left", children }: { align?: Align; children: ReactNode }) {
  return <th className={cn("h-10 bg-(--background-elevated) px-4 text-sm font-normal whitespace-nowrap", ALIGN[align])}>{children}</th>;
}

function Body({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

/** A row is pressable when it has `onPress`, or a `value` and the table has `onRowPress`. */
function Row({ value, onPress, children }: { value?: string; onPress?: () => void; children: ReactNode }) {
  const tablePress = useContext(RowPress);
  const press = onPress ?? (value !== undefined && tablePress ? () => tablePress(value) : undefined);
  return (
    <tr
      onClick={press}
      onKeyDown={press ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); press(); } } : undefined}
      tabIndex={press ? 0 : undefined}
      className={cn("border-b border-(--border) last:border-b-0", press && "cursor-pointer hover:bg-(--hover)")}
    >
      {children}
    </tr>
  );
}

function Cell({ align = "left", children }: { align?: Align; children?: ReactNode }) {
  return <td className={cn("h-12 px-4 align-middle", ALIGN[align])}>{children}</td>;
}

export const Table = Object.assign(TableRoot, { Header, Column, Body, Row, Cell });

// ---- toasts -------------------------------------------------------------------------------

interface ToastItem { id: number; variant: Feedback; title: string; description?: string }
let toasts: ToastItem[] = [];
let nextToast = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function dismiss(id: number) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

/** Show a notification bottom right. Works from anywhere once <ToastProvider> is mounted. */
export function toast({ variant = "info", title, description, duration = 5000 }: { variant?: Feedback; title: string; description?: string; duration?: number }) {
  const id = nextToast++;
  toasts = [{ id, variant, title, description }, ...toasts].slice(0, 5);
  emit();
  setTimeout(() => dismiss(id), duration);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => toasts,
  );
  return (
    <>
      {children}
      <div className="fixed right-6 bottom-6 z-50 flex w-96 max-w-[calc(100vw-3rem)] flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} role={item.variant === "warning" || item.variant === "error" ? "alert" : "status"} className={cn("xs-toast flex flex-col text-(--feedback-foreground)", FEEDBACK_BG[item.variant])}>
            <div className="flex items-start gap-3 border border-(--feedback-foreground) px-3 py-3">
              <div className="flex flex-1 flex-col gap-0.5 text-sm">
                <span className="font-semibold">{item.title}</span>
                {item.description ? <span className="opacity-70">{item.description}</span> : null}
              </div>
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(item.id)} className="cursor-pointer leading-none">×</button>
            </div>
            <div aria-hidden="true" className="xs-hatch h-1 border-x border-b border-(--feedback-foreground)" />
          </div>
        ))}
      </div>
    </>
  );
}

// ---- hooks --------------------------------------------------------------------------------

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);
  return {
    copied,
    copy: (text: string) => {
      void navigator.clipboard?.writeText(text).then(() => setCopied(true), () => undefined);
    },
  };
}
