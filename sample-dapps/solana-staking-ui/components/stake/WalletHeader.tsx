import { Flex, Text } from "@radix-ui/themes";
import Image from "next/image";
import { shortenAddress } from "@/utils/solana/address";

interface WalletHeaderProps {
  address?: string;
  balance: number;
}

export function WalletHeader({ address, balance }: WalletHeaderProps) {
  return (
    <Flex align="center" gap="3">
      <Image src="/solana-logo.svg" alt="Solana Logo" width={30} height={30} />
      <Flex direction="column">
        <Text size="3" weight="bold">
          {address && shortenAddress(address)}
        </Text>
        <Text size="2" color="gray">
          Balance: {balance.toFixed(2)} SOL
        </Text>
      </Flex>
    </Flex>
  );
}
