import {
  Dialog,
  Flex,
  Text,
  Card,
  Link,
  Button,
  Separator
} from "@radix-ui/themes";
import { CheckIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { shortenAddress } from "@/utils/solana/address";
import {
  getExplorerAccountUrl,
  getExplorerTxUrl,
  getValidatorAddress
} from "@/utils/config";

interface StakeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  stakeAccount?: string;
  signature?: string;
}

export function StakeSuccessModal({
  isOpen,
  onClose,
  stakeAccount,
  signature
}: StakeSuccessModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          background: "var(--gray-1)",
          border: "1px solid var(--gray-5)",
          maxWidth: "480px",
          padding: "24px"
        }}
      >
        <Flex direction="column" gap="5">
          {/* Success Header */}
          <Flex direction="column" gap="2" style={{ textAlign: "center" }}>
            <div style={{ margin: "0 auto", position: "relative" }}>
              <Image
                src="/quicknode.svg"
                alt="Quicknode Logo"
                width={64}
                height={64}
                style={{
                  borderRadius: "50%",
                  padding: "8px",
                  background: "var(--gray-2)",
                  animation: "pulse 2s infinite"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  background: "#16a34a",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  border: "3px solid var(--gray-1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <CheckIcon width={12} height={12} color="white" />
              </div>
            </div>
            <Dialog.Title
              style={{
                color: "#009fd1",
                fontSize: "24px",
                fontWeight: "bold",
                marginTop: "12px"
              }}
            >
              Stake Account Created!
            </Dialog.Title>
            <Text size="2" color="gray" style={{ marginTop: "-8px" }}>
              Your stake is activating and will be earning rewards next epoch!
            </Text>
          </Flex>

          <Separator size="4" />

          {/* Account Details */}
          <Card style={{ background: "var(--gray-2)", padding: "16px" }}>
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Text size="2" color="gray">
                  Stake Account
                </Text>
                <Link
                  href={
                    stakeAccount
                      ? getExplorerAccountUrl({
                          account: stakeAccount,
                          explorer: "solana-explorer"
                        })
                      : "#"
                  }
                  target="_blank"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#009fd1"
                  }}
                >
                  {stakeAccount && shortenAddress(stakeAccount)}
                  <ExternalLinkIcon width={12} height={12} />
                </Link>
              </Flex>
              <Flex justify="between" align="center">
                <Text size="2" color="gray">
                  Transaction
                </Text>
                <Link
                  href={
                    signature
                      ? getExplorerTxUrl({
                          signature: signature,
                          explorer: "solana-explorer"
                        })
                      : "#"
                  }
                  target="_blank"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#009fd1"
                  }}
                >
                  {signature && shortenAddress(signature)}
                  <ExternalLinkIcon width={12} height={12} />
                </Link>
              </Flex>
              <Flex justify="between" align="center">
                <Text size="2" color="gray">
                  Validator
                </Text>
                <Link
                  href={`https://stakewiz.com/validator/${getValidatorAddress()}`}
                  target="_blank"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#009fd1"
                  }}
                >
                  Quicknode
                  <ExternalLinkIcon width={12} height={12} />
                </Link>
              </Flex>
            </Flex>
          </Card>

          {/* View Options */}
          {signature && (
            <Flex gap="3" justify="between">
              <Button
                variant="soft"
                onClick={() => {
                  window.open(
                    getExplorerTxUrl({
                      signature: signature,
                      explorer: "solana-explorer"
                    }),
                    "_blank"
                  );
                }}
                style={{ flex: 1 }}
              >
                Explorer
              </Button>
              <Button
                variant="soft"
                onClick={() => {
                  window.open(
                    getExplorerTxUrl({
                      signature: signature,
                      explorer: "solscan"
                    }),
                    "_blank"
                  );
                }}
                style={{ flex: 1 }}
              >
                Solscan
              </Button>
              <Button
                variant="soft"
                onClick={() => {
                  window.open(
                    getExplorerTxUrl({
                      signature: signature,
                      explorer: "solana-fm"
                    }),
                    "_blank"
                  );
                }}
                style={{ flex: 1 }}
              >
                Solana FM
              </Button>
            </Flex>
          )}

          <style jsx global>{`
            @keyframes pulse {
              0% {
                box-shadow: 0 0 0 0 rgba(0, 159, 209, 0.4);
              }
              70% {
                box-shadow: 0 0 0 10px rgba(0, 159, 209, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(0, 159, 209, 0);
              }
            }
          `}</style>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
