"use client";
import { useState, useContext } from "react";
import {
  useWallets,
  useConnect,
  UiWallet,
  UiWalletAccount
} from "@wallet-standard/react";
import { SelectedWalletAccountContext } from "../context/SelectedWalletAccountContext";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogPortal,
  DialogTitle
} from "@radix-ui/react-dialog";
import { Button, Flex, Text, Card, Link, Separator } from "@radix-ui/themes";
import { StandardConnect, StandardDisconnect } from "@wallet-standard/core";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import Image from "next/image";

/** Utility function to compare wallet accounts */
function uiWalletAccountsAreSame(
  account1: UiWalletAccount,
  account2: UiWalletAccount
): boolean {
  return account1.address === account2.address;
}

/** Main Wallet Connection Component */
function WalletConnectButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [, setSelectedWalletAccount] = useContext(SelectedWalletAccountContext);

  const handleAccountSelect = (account: UiWalletAccount | undefined) => {
    setSelectedWalletAccount(account);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={true}>
      <DialogTrigger asChild>
        <Button
          size="3"
          className="hover:bg-blue-600 transition-colors"
          style={{
            width: "100%",
            background: "#009fd1",
            color: "white",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 100
          }}
        >
          Connect Wallet
        </Button>
      </DialogTrigger>

      <DialogPortal>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <DialogContent
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[420px] rounded-xl bg-[#1C1C1C] border border-[#2C2C2C] p-6 shadow-2xl focus:outline-none z-50 data-[state=open]:animate-contentShow"
          onClick={(e) => e.stopPropagation()}
        >
          <Flex direction="column" gap="5">
            {/* Header */}
            <Flex direction="column" gap="2" style={{ textAlign: "center" }}>
              <div style={{ margin: "0 auto", position: "relative" }}>
                <Image
                  src="/quicknode.svg"
                  alt="QuickNode Logo"
                  width={64}
                  height={64}
                  style={{
                    padding: "8px"
                  }}
                />
              </div>
              <DialogTitle asChild>
                <Text
                  size="8"
                  weight="bold"
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#009fd1",
                    marginTop: "12px"
                  }}
                >
                  Connect Wallet
                </Text>
              </DialogTitle>
              <Text
                size="3"
                style={{
                  marginTop: "-4px",
                  color: "#999999",
                  marginBottom: "10px"
                }}
              >
                Select a wallet to start staking your SOL
              </Text>
            </Flex>

            <Separator
              size="4"
              style={{ margin: "0 0 5px 0", background: "#2C2C2C" }}
            />

            {/* Wallet Options */}
            <Card
              style={{
                background: "transparent",
                padding: "0px",
                border: "none",
                boxShadow: "none",
                margin: "0 0 5px 0"
              }}
            >
              <ConnectWalletDialog onAccountSelect={handleAccountSelect} />
            </Card>

            {/* Footer */}
            <Flex direction="column" gap="3" style={{ textAlign: "center" }}>
              <Text size="2" style={{ color: "#999999" }}>
                New to Solana?{" "}
                <Link
                  href="https://docs.solana.com/wallet-guide"
                  target="_blank"
                  style={{ color: "#009fd1", cursor: "pointer" }}
                >
                  Learn about wallets
                  <ExternalLinkIcon
                    style={{
                      display: "inline",
                      marginLeft: "4px",
                      verticalAlign: "middle"
                    }}
                  />
                </Link>
              </Text>
            </Flex>
          </Flex>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

/** Dialog Displaying Wallet Options */
interface ConnectWalletDialogProps {
  onAccountSelect: (account: UiWalletAccount | undefined) => void;
}

function ConnectWalletDialog({ onAccountSelect }: ConnectWalletDialogProps) {
  const wallets = useWallets();

  const connectableWallets = wallets
    .filter(
      (wallet: UiWallet) =>
        wallet.features.includes(StandardConnect) &&
        wallet.features.includes(StandardDisconnect)
    )
    .reduce((unique: UiWallet[], wallet: UiWallet) => {
      const exists = unique.find((w) => w.name === wallet.name);
      if (!exists) {
        unique.push(wallet);
      }
      return unique;
    }, []);

  return (
    <Flex direction="column" gap="2">
      {connectableWallets.length === 0 ? (
        <Text size="2" color="gray" align="center">
          No compatible wallets found
        </Text>
      ) : (
        connectableWallets.map((wallet: UiWallet) => (
          <WalletConnectItem
            key={wallet.name}
            wallet={wallet}
            onAccountSelect={onAccountSelect}
          />
        ))
      )}
    </Flex>
  );
}

/** Individual Wallet Connection Item */
interface WalletConnectItemProps {
  wallet: UiWallet;
  onAccountSelect: (account: UiWalletAccount | undefined) => void;
}

function WalletConnectItem({
  wallet,
  onAccountSelect
}: WalletConnectItemProps) {
  const [isConnecting, connect] = useConnect(wallet);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = async () => {
    try {
      const existingAccounts = [...wallet.accounts];
      const nextAccounts = await connect();
      const newAccount = nextAccounts.find(
        (nextAccount) =>
          !existingAccounts.some((existingAccount) =>
            uiWalletAccountsAreSame(nextAccount, existingAccount)
          )
      );
      const accountToSelect = newAccount || nextAccounts[0];
      if (accountToSelect) {
        onAccountSelect(accountToSelect);
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  return (
    <Button
      size="3"
      onClick={handleClick}
      disabled={isConnecting}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="wallet-connect-item"
      style={{
        width: "100%",
        background: isConnecting
          ? "#2C2C2C"
          : isHovered
            ? "rgba(0, 159, 209, 0.1)"
            : "#242424",
        color: isConnecting ? "#999999" : "white",
        cursor: isConnecting ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "20px",
        margin: "1% 0",
        borderRadius: "12px",
        transition: "all 0.2s ease",
        border: `1px solid ${isHovered ? "#009fd1" : "#2C2C2C"}`,
        boxShadow: isHovered ? "0 2px 8px rgba(0,159,209,0.15)" : "none",
        fontWeight: "500"
      }}
    >
      <Image
        src={wallet.icon}
        alt={wallet.name}
        width={32}
        height={32}
        style={{
          borderRadius: "8px",
          padding: "0px",
          background: "transparent"
        }}
      />
      <Text
        size="3"
        style={{
          flex: 1,
          textAlign: "left",
          fontWeight: "500",
          color: isConnecting ? "#999999" : "white"
        }}
      >
        {isConnecting ? "Connecting..." : wallet.name}
      </Text>
    </Button>
  );
}

export { WalletConnectButton };

// Add global styles for animations
const styles = `
  @keyframes contentShow {
    from {
      opacity: 0;
      transform: translate(-50%, -48%) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  .wallet-connect-item:hover {
    transform: translateY(-1px);
  }
`;

// Add style tag to document
if (typeof document !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);
}
