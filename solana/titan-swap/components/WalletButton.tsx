"use client";

import { useEffect, useRef, useState } from "react";
import { useConnect, useDisconnect } from "@wallet-standard/react";
import type { UiWallet, UiWalletAccount } from "@wallet-standard/react";
import { useWalletAccount } from "@/app/providers/WalletProvider";

const formatAddress = (address: string) =>
  `${address.slice(0, 4)}…${address.slice(-4)}`;

const triggerClass =
  "flex items-center gap-2 px-3 py-2 border border-border text-fg-muted hover:bg-bg-hover hover:text-fg transition-colors font-mono text-[11px] uppercase tracking-wide";
const dropdownPanelClass =
  "absolute right-0 mt-1 z-10 min-w-[180px] border border-border bg-bg-elev";
const dropdownItemClass =
  "w-full px-3 py-2 text-left hover:bg-bg-hover text-fg-muted hover:text-fg font-mono text-[11px]";

/** Dropdown open-state that closes when you click outside the returned ref. */
function useClickOutside<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);
  return { ref, open, setOpen };
}

/** One selectable wallet in the connect dropdown. `useConnect` is per-wallet, so
 *  each entry owns its own hook. */
function WalletMenuItem({
  wallet,
  onConnected,
}: {
  wallet: UiWallet;
  onConnected: (account: UiWalletAccount) => void;
}) {
  const [isConnecting, connect] = useConnect(wallet);

  return (
    <button
      type="button"
      disabled={isConnecting}
      onClick={async () => {
        const accounts = await connect();
        if (accounts[0]) onConnected(accounts[0]);
      }}
      className={`${dropdownItemClass} flex items-center gap-2 disabled:opacity-50`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={wallet.icon} alt="" className="w-4 h-4" />
      <span>{wallet.name}</span>
      {isConnecting && <span className="ml-auto text-fg-ghost">…</span>}
    </button>
  );
}

/** Connected state: shows the address and a disconnect action. `useDisconnect`
 *  is per-wallet, so this is its own component once the owning wallet is known. */
function ConnectedButton({
  wallet,
  account,
  onDisconnected,
}: {
  wallet: UiWallet;
  account: UiWalletAccount;
  onDisconnected: () => void;
}) {
  const { ref, open, setOpen } = useClickOutside<HTMLDivElement>();
  const [, disconnect] = useDisconnect(wallet);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className={triggerClass}>
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--accent)" }}
        />
        {formatAddress(account.address)}
      </button>
      {open && (
        <div className={dropdownPanelClass}>
          <button
            type="button"
            onClick={async () => {
              try {
                await disconnect();
              } finally {
                onDisconnected();
                setOpen(false);
              }
            }}
            className={`${dropdownItemClass} uppercase tracking-wide`}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

export function WalletButton() {
  const { account, setAccount, wallets, wallet } = useWalletAccount();
  const { ref, open, setOpen } = useClickOutside<HTMLDivElement>();

  // Connected and the owning wallet is still present: offer a real disconnect.
  if (account && wallet) {
    return (
      <ConnectedButton
        wallet={wallet}
        account={account}
        onDisconnected={() => setAccount(undefined)}
      />
    );
  }

  // Connected but the wallet vanished (e.g. extension removed): just clear it.
  if (account) {
    return (
      <button type="button" onClick={() => setAccount(undefined)} className={triggerClass}>
        {formatAddress(account.address)}
      </button>
    );
  }

  // Disconnected: dropdown of discovered Solana wallets.
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} className={triggerClass}>
        Connect Wallet
      </button>
      {open && (
        <div className={dropdownPanelClass}>
          {wallets.length === 0 ? (
            <div className="px-3 py-2 font-mono text-[11px] text-fg-ghost">
              No Solana wallets found
            </div>
          ) : (
            wallets.map((w) => (
              <WalletMenuItem
                key={w.name}
                wallet={w}
                onConnected={(acc) => {
                  setAccount(acc);
                  setOpen(false);
                }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
