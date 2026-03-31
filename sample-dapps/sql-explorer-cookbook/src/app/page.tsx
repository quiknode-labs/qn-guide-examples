import Link from "next/link";
import { QUERIES } from "@/data/queries";

const featuredQueries = QUERIES.filter((q) => q.featured);

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Hero */}
      <div className="text-center">
        <p className="font-mono text-sm uppercase tracking-widest text-[var(--color-text-tertiary)]">
          // SAMPLE APP
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          SQL Explorer <span className="text-highlight">Cookbook</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--color-text-secondary)]">
          <a
            href="https://www.quicknode.com/sql-explorer"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--color-brand)] hover:underline"
          >
            Quicknode SQL Explorer
          </a>{" "}
          lets you query on-chain data with standard SQL — no indexers, no
          subgraphs, just a REST API. This cookbook showcases 40+ ready-to-run
          queries for Hyperliquid to help you get started.
        </p>
      </div>

      {/* Example Implementations */}
      <section className="mt-16">
        <h2 className="text-xl font-semibold">Example Implementations</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Deep-dive pages showing common query patterns with visualizations
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredQueries.map((query) => (
            <Link
              key={query.id}
              href={`/use-cases/${query.useCaseSlug}`}
              className="group rounded-xl border border-[var(--color-border)] p-5 transition-all hover:border-[var(--color-brand)] hover:shadow-md"
            >
              <span className="inline-block rounded-full bg-[var(--color-bg-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">
                {query.category}
              </span>
              <h3 className="mt-3 font-semibold group-hover:text-[var(--color-brand)]">
                {query.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {query.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Explore All CTA */}
      <div className="mt-10 text-center">
        <Link
          href="/explorer"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-6 py-3 text-sm font-mono font-medium uppercase tracking-wider text-black transition-opacity hover:opacity-90"
        >
          Explore All Queries
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </Link>
      </div>

      {/* Quick Start */}
      <section className="mt-16">
        <h2 className="text-xl font-semibold">Quick Start</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-bold text-black">
              1
            </div>
            <div>
              <h3 className="font-medium">Clone the repo</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Clone{" "}
                <a
                  href="https://github.com/quiknode-labs/qn-guide-examples"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--color-brand)] hover:underline"
                >
                  qn-guide-examples
                </a>
                , navigate to{" "}
                <code className="rounded bg-[var(--color-bg-tertiary)] px-1 py-0.5 font-mono text-xs">
                  sample-dapps/sql-explorer-cookbook
                </code>{" "}
                and run{" "}
                <code className="rounded bg-[var(--color-bg-tertiary)] px-1 py-0.5 font-mono text-xs">
                  npm install
                </code>
                .
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-bold text-black">
              2
            </div>
            <div>
              <h3 className="font-medium">Set your API key</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Copy{" "}
                <code className="rounded bg-[var(--color-bg-tertiary)] px-1 py-0.5 font-mono text-xs">
                  .env.example
                </code>{" "}
                to{" "}
                <code className="rounded bg-[var(--color-bg-tertiary)] px-1 py-0.5 font-mono text-xs">
                  .env.local
                </code>{" "}
                and add your{" "}
                <a
                  href="https://dashboard.quicknode.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[var(--color-brand)] hover:underline"
                >
                  Quicknode API key
                </a>{" "}
                with the SQL application enabled.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-sm font-bold text-black">
              3
            </div>
            <div>
              <h3 className="font-medium">Run the app</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                <code className="rounded bg-[var(--color-bg-tertiary)] px-1 py-0.5 font-mono text-xs">
                  npm run dev
                </code>{" "}
                — browse queries, view results, and copy code snippets.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
