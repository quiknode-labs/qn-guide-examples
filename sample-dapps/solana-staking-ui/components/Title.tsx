import { Flex, Text } from "@radix-ui/themes";
import Image from "next/image";

export const Title = () => {
  return (
    <Flex
      direction="column"
      align="center"
      gap="4"
      mb="4"
      style={{ width: "100%" }}
    >
      <Flex
        align="center"
        gap="3"
        style={{
          flexWrap: "wrap",
          justifyContent: "center",
          textAlign: "center"
        }}
      >
        <Image
          src="/solana-logo.svg"
          alt="Solana Logo"
          width={40}
          height={40}
        />
        <Text
          size="8"
          weight="bold"
          style={{
            letterSpacing: "-0.02em",
            textAlign: "center"
          }}
        >
          Stake SOL
        </Text>
      </Flex>
      <Text
        size="3"
        color="gray"
        style={{
          maxWidth: "600px",
          textAlign: "center",
          padding: "0 16px"
        }}
      >
        Stake Smarter. Earn Faster. With Quicknode.
      </Text>
    </Flex>
  );
};
