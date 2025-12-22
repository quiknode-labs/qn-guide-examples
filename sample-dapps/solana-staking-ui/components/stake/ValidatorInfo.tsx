import { Card, Flex, Text, Badge, Link } from "@radix-ui/themes";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { getValidatorAddress } from "@/utils/config";
import { shortenAddress } from "@/utils/solana/address";

interface ValidatorInfoProps {
  apy: string;
}

export function ValidatorInfo({ apy }: ValidatorInfoProps) {
  return (
    <Card style={{ background: "var(--gray-2)" }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Text size="2" weight="bold">
            Validator
          </Text>
          <Badge size="1" color="mint">
            {apy} APY
          </Badge>
        </Flex>
        <Flex align="center" gap="2">
          <Image
            src="/quicknode.svg"
            alt="Quicknode Logo"
            width={40}
            height={40}
            style={{ borderRadius: "50%", padding: "2px" }}
          />
          <Flex direction="column" gap="1">
            <Text size="3">Quicknode</Text>
            <Link
              size="1"
              target="_blank"
              href={`https://stakewiz.com/validator/${getValidatorAddress()}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              Vote Account: {shortenAddress(getValidatorAddress())}
              <ExternalLinkIcon width={12} height={12} />
            </Link>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}
