export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Powered by{" "}
            <a
              href="https://www.quicknode.com/sql-explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--color-brand)] hover:underline"
            >
              Quicknode SQL Explorer
            </a>
          </p>
          <div className="flex gap-4 text-sm text-[var(--color-text-tertiary)]">
            <a
              href="https://www.quicknode.com/docs/sql-explorer"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-text-secondary)]"
            >
              Docs
            </a>
            <a
              href="https://www.quicknode.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-text-secondary)]"
            >
              Sign Up
            </a>
            <a
              href="https://github.com/quiknode-labs/qn-guide-examples"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--color-text-secondary)]"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
