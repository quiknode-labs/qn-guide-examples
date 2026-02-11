"use client";

import { Section } from "@/components/ui/section";
import { useCallback, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { CreditsPanel } from "@/components/credits-panel";
import { ExplorerPanel } from "@/components/explorer-panel";
import { Header } from "@/components/header";
import { LandingView } from "@/components/landing-view";
import { ResultsFeed } from "@/components/results-feed";
import { WalletPanel } from "@/components/wallet-panel";
import { useCredits } from "@/hooks/use-credits";
import { useX402Auth } from "@/hooks/use-x402-auth";
import { useX402Fetch } from "@/hooks/use-x402-fetch";
import type { Method } from "@/lib/types";

export default function Home() {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const {
    jwt,
    accountId,
    expiresAt,
    isAuthenticated,
    isAuthenticating,
    authError,
    authenticate,
  } = useX402Auth();

  const {
    credits,
    isLoading: creditsLoading,
    error: creditsError,
    refresh: refreshCredits,
  } = useCredits({ jwt, isAuthenticated });

  const { results, isExecuting, execute, clearResults } = useX402Fetch({
    walletClient,
    jwt,
  });

  const [executingMethodId, setExecutingMethodId] = useState<string | null>(
    null,
  );

  const handleExecute = useCallback(
    async (method: Method) => {
      setExecutingMethodId(method.id);
      await execute(method);
      void refreshCredits();
      setExecutingMethodId(null);
    },
    [execute, refreshCredits],
  );

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />

      <main className="min-h-[calc(100vh-57px)]">
        {!isConnected ? (
          <LandingView />
        ) : (
          <Section
            dotGrid
            dotGridClassName="mask-t-from-40%"
            className="py-3 md:py-4"
          >
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 md:px-8">
              <WalletPanel
                jwt={jwt}
                isAuthenticated={isAuthenticated}
                isAuthenticating={isAuthenticating}
                authError={authError}
                accountId={accountId}
                expiresAt={expiresAt}
                onAuthenticate={authenticate}
              />

              {isAuthenticated && (
                <>
                  <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
                    <CreditsPanel
                      credits={credits}
                      isLoading={creditsLoading}
                      error={creditsError}
                      onRefresh={refreshCredits}
                    />
                    <ExplorerPanel
                      isExecuting={isExecuting}
                      executingMethodId={executingMethodId}
                      onExecute={(method) => void handleExecute(method)}
                    />
                  </div>

                  <ResultsFeed results={results} onClear={clearResults} />
                </>
              )}
            </div>
          </Section>
        )}
      </main>

      <footer className="border-t border-(--border) bg-(--background) px-4 py-4 text-center text-sm text-(--foreground-light) md:px-8">
        Built with{" "}
        <a
          href="https://x402.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-(--foreground)"
        >
          x402
        </a>{" "}
        &middot; Powered by{" "}
        <a
          href="https://www.quicknode.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-(--foreground)"
        >
          Quicknode
        </a>
      </footer>
    </div>
  );
}
