import type { ReactNode } from "react";
import { Panel, cn } from "../ui.tsx";

function Square() {
  return <span className="h-[14px] w-[14px] shrink-0 border border-(--foreground) bg-(--background)" />;
}

/**
 * Dashboard panel. A white surface with an ink frame, a 4px bottom border, and the terminal
 * header from the chart skill: rail lines, squares, and a mono "// LABEL".
 */
export function Frame({ id, label, answer, how, action, children, className, bodyClassName, dots = false }: {
  /** Anchor for the summary cards to scroll to. */
  id?: string;
  label: string;
  /** What the panel shows right now, written from the live data. Shown above the chart. */
  answer?: ReactNode;
  /** How the numbers are worked out. Collapsed until the reader asks. */
  how?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  dots?: boolean;
}) {
  return (
    <section id={id} data-theme="white" className={cn("min-w-0 scroll-mt-4", className)}>
      <Panel size="none" ink className="h-full w-full items-stretch">
        <header className="flex min-h-10 items-center gap-1 border-b border-(--foreground) px-3">
          <span className="xs-rail w-2 shrink-0" />
          <Square />
          <span className="xs-rail min-w-2 flex-1" />
          <span className="xs-num shrink-0 px-2 text-xs uppercase whitespace-nowrap text-(--foreground)">
            <span aria-hidden="true">// </span>
            {label}
          </span>
          <span className="xs-rail min-w-2 flex-1" />
          <Square />
          <span className="xs-rail w-2 shrink-0" />
          {action ? <span className="ml-2 shrink-0">{action}</span> : null}
        </header>
        <div className={cn("relative min-h-0 flex-1 p-4", bodyClassName)}>
          {dots ? <div aria-hidden="true" className="xs-dotgrid pointer-events-none absolute inset-0" /> : null}
          <div className="relative flex h-full flex-col gap-3">
            {answer ? <p className="m-0 text-base text-(--foreground)">{answer}</p> : null}
            {children}
            {how ? (
              <details className="mt-auto text-sm text-(--foreground-medium)">
                <summary className="xs-num w-fit cursor-pointer text-xs uppercase text-(--foreground-medium) hover:text-(--foreground)">How this is worked out</summary>
                <div className="mt-2 flex max-w-[80ch] flex-col gap-2">{how}</div>
              </details>
            ) : null}
          </div>
        </div>
      </Panel>
    </section>
  );
}

/** Striped placeholder shown while a panel has too little data to chart. */
export function WarmingUp({ since, detail, height = 220 }: { since: number; detail: string; height?: number }) {
  return (
    <div className="xs-stripes flex flex-col items-center justify-center gap-2 border border-(--border)" style={{ height }}>
      <span className="bg-(--background) px-2 py-1 text-sm text-(--foreground)">
        Collecting data since <span className="xs-num">{new Date(since).toLocaleTimeString("en-US", { hour12: false })}</span>
      </span>
      <span className="xs-num bg-(--background) px-2 py-1 text-xs text-(--foreground-medium)">{detail}</span>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="m-0 text-xs text-(--foreground-medium)">{children}</p>;
}

export function Swatch({ color }: { color: string }) {
  return <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 border border-(--foreground)" style={{ background: color }} />;
}

/** Dot grid behind a chart. Text stays on a plain surface so it reads cleanly. */
export function Plot({ children }: { children: ReactNode }) {
  return <div className="xs-dotgrid">{children}</div>;
}
