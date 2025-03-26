"use client";
import { useContext } from "react";
import { useWallets, useDisconnect, UiWallet } from "@wallet-standard/react";
import { SelectedWalletAccountContext } from "../context/SelectedWalletAccountContext";
import { Button } from "@radix-ui/themes";

function WalletDisconnectButton() {
  const [selectedWalletAccount, setSelectedWalletAccount] = useContext(
    SelectedWalletAccountContext
  );
  const wallets = useWallets();
  const wallet = wallets.find((w: UiWallet) =>
    w.accounts.some((a) => a.address === selectedWalletAccount?.address)
  );
  const [isDisconnecting, disconnect] = useDisconnect(wallet || wallets[0]);

  if (!wallet || !selectedWalletAccount) return null;

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setSelectedWalletAccount(undefined);
    } catch (error) {
      console.error("Disconnection error:", error);
    }
  };

  return (
    <Button
      size="3"
      onClick={handleDisconnect}
      disabled={isDisconnecting}
      className="hover:bg-red-600 transition-colors"
      style={{
        width: "100%",
        background: isDisconnecting ? "#ccc" : "var(--gray-3)",
        color: "white",
        cursor: isDisconnecting ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}
    >
      {isDisconnecting ? "Disconnecting..." : "Disconnect"}
    </Button>
  );
}

export { WalletDisconnectButton };
