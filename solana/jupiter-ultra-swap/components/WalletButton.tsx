"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function WalletButton() {
  const { wallet, disconnect, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = () => {
    if (publicKey) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}…${address.slice(-4)}`;
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium transition-colors"
    >
      {publicKey ? formatAddress(publicKey.toBase58()) : "Connect Wallet"}
    </button>
  );
}

