"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function WalletButton() {
  const { disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = () => {
    if (publicKey) disconnect();
    else setVisible(true);
  };

  const formatAddress = (address: string) =>
    `${address.slice(0, 4)}…${address.slice(-4)}`;

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-2 border border-border text-fg-muted hover:bg-bg-hover hover:text-fg transition-colors font-mono text-[11px] uppercase tracking-wide"
    >
      {publicKey && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--accent)" }}
        />
      )}
      {publicKey ? formatAddress(publicKey.toBase58()) : "Connect Wallet"}
    </button>
  );
}
