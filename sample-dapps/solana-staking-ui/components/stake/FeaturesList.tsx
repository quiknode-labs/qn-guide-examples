import { Flex, Text } from "@radix-ui/themes";
import { DotFilledIcon } from "@radix-ui/react-icons";

const FEATURES = [
  "0% Commission: 100% Fees and Jito Tips to Stakers",
  "100% Uptime",
  "Help secure the Solana Network",
  "Maintain full custody of your assets",
  "Compliance: SOC 1 Type 2, SOC 2 Type 2 Compliance"
] as const;

export function FeaturesList() {
  return (
    <Flex direction="column" gap="2">
      <Text size="2" weight="bold">
        Why stake with Quicknode:
      </Text>
      {FEATURES.map((feature) => (
        <Flex align="center" gap="2" key={feature}>
          <DotFilledIcon width={16} height={16} color="#009fd1" />
          <Text size="2">{feature}</Text>
        </Flex>
      ))}
    </Flex>
  );
}
