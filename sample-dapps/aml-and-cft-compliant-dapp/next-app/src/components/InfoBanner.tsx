// src/components/InfoBanner.tsx
"use client";

import React from "react";
import { Paper, Text, Title, Anchor, Group, ThemeIcon } from "@mantine/core";
import { IconShieldCheck, IconBrandGithub } from "@tabler/icons-react";

export function InfoBanner() {
  return (
    <Paper withBorder p="md" radius="md" mb="xl" shadow="sm">
      <Group gap="sm" mb="xs">
        <ThemeIcon color="blue" size="lg" variant="light" radius="xl">
          <IconShieldCheck size={20} />
        </ThemeIcon>
        <Title order={4}>Risk-Secured DeFi Application</Title>
      </Group>

      <Text size="sm" mb="xs">
        This application uses the{" "}
        <Anchor
          href="https://marketplace.quicknode.com/add-on/risk-assessment-api"
          target="_blank"
          underline="always"
        >
          Risk Assessment API
        </Anchor>{" "}
        add-on on the Quicknode marketplace to secure both frontend interactions
        and smart contract operations, ensuring the highest level of security.
        Communication between the API and smart contract is done through
        Chainlink Functions.
      </Text>

      <Text size="sm">
        This security approach prevents not only UI-level interactions but also
        direct smart contract calls, creating a fully compliant DeFi
        application.
      </Text>

      <Group justify="space-between" align="center" mt="md">
        <Anchor
          href="https://github.com/quiknode-labs/qn-guide-examples"
          target="_blank"
          size="sm"
        >
          <Group gap="xs">
            <IconBrandGithub size={16} />
            <Text>View Full Code on GitHub</Text>
          </Group>
        </Anchor>

        <Group gap="xs" justify="right">
          <Text size="xs" c="dimmed">
            Powered by{" "}
            <Anchor href="https://www.quicknode.com" target="_blank">
              Quicknode
            </Anchor>
          </Text>
        </Group>
      </Group>
    </Paper>
  );
}
