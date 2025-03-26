"use client";
import { Flex } from "@radix-ui/themes";
import { StakingForm } from "@/components/stake/StakingForm";
import { Title } from "@/components/Title";

export default function Home() {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{
        padding: "20px",
        width: "100%"
      }}
    >
      <Title />
      <StakingForm />
    </Flex>
  );
}
