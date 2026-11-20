import { Loader, Message, Progress } from "../ui.tsx";
import type { Snapshot } from "../../../shared/types.ts";
import { Frame, Note } from "../components/Frame.tsx";

const GLYPH = { done: "✓", active: "…", pending: "", error: "!" } as const;

/** Full-screen checklist shown until the gRPC stream is connected. */
export function Startup({ snapshot }: { snapshot: Snapshot }) {
  const { status } = snapshot;
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16">
      <Frame label="Starting up" dots={false}>
        <p className="m-0 text-sm text-(--foreground)">
          The app watches from the moment it starts. There is no backfill, so charts fill in while it runs.
        </p>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {status.steps.map((step) => (
            <li key={step.key} className="flex items-center gap-3 border border-(--border) px-3 py-2.5">
              <span className="xs-num flex h-6 w-6 shrink-0 items-center justify-center border border-(--foreground) text-xs">
                {step.state === "active" ? <Loader label={step.label} /> : GLYPH[step.state]}
              </span>
              <span className="flex-1 text-sm text-(--foreground)">{step.label}</span>
              <span className="xs-num text-xs text-(--foreground-medium)">{step.detail}</span>
            </li>
          ))}
        </ul>
        <Progress value={status.progress} aria-label="Startup progress" />
        {status.error ? <Message variant="error" title="Startup failed." description={`${status.error} Check .env and restart the server.`} /> : null}
        {status.reconnect ? (
          <Message variant="warning" description={`Could not open the stream (attempt ${status.reconnect.attempt}). Retrying. ${status.reconnect.reason}`} />
        ) : null}
        <Note>{snapshot.disclaimer}</Note>
      </Frame>
    </main>
  );
}
