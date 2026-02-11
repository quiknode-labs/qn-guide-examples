"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Highlight } from "@/components/ui/highlight";
import { Section } from "@/components/ui/section";
import { ConnectKitButton } from "connectkit";

export function LandingView() {
  return (
    <Section
      dotGrid
      dotGridClassName="mask-t-from-40%"
      className="min-h-[calc(100vh-57px)]"
    >
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 text-center md:px-8">
        <Badge>X402 ON QUICKNODE</Badge>
        <Heading level={2}>
          Pay-per-Request Access to <Highlight>130+ Chains</Highlight>
        </Heading>
        <p className="text-base text-(--foreground-medium)">
          No account, API keys, or subscription needed. Connect a wallet,
          authenticate with SIWE, and start making RPC calls — pay only for what
          you use with USDC.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ConnectKitButton.Custom>
            {({ show }) => (
              <Button size="lg" onClick={show}>
                Connect Wallet to Try
              </Button>
            )}
          </ConnectKitButton.Custom>
        </div>
      </div>
    </Section>
  );
}
