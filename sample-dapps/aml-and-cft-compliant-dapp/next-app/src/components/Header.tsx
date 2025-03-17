"use client"

import React from "react";

import { ConnectKitButton } from "connectkit";
import { Box, Container, Group, Title } from "@mantine/core";

export function Header() {
  return (
    <Box className="header" py="md" mb="xl">
      <Container size="lg">
        <Group justify="space-between" align="center">
          <Title order={2} c="blue.8" fw={700}>
            Risk-Based Staking
          </Title>
          <Group>
            <ConnectKitButton showBalance={true} theme="soft" />
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
