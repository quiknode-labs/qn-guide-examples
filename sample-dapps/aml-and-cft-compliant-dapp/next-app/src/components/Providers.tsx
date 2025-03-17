// src/components/Providers.tsx
"use client";

import React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { MantineProvider, createTheme } from "@mantine/core";
import { config } from "@/config/wagmiConfig";

// Create a client
const queryClient = new QueryClient();

// Create a Mantine theme
const theme = createTheme({
  primaryColor: "blue",
  defaultRadius: "md",
  colors: {
    blue: [
      "#e9f5fe",
      "#c8e3fb",
      "#a7d1f7",
      "#85bff3",
      "#64adf0",
      "#439bec",
      "#2189e8",
      "#0077e4",
      "#0065e0",
      "#0053dc",
    ],
  },
  components: {
    Button: {
      defaultProps: {
        size: "md",
      },
    },
    Card: {
      defaultProps: {
        shadow: "sm",
      },
      styles: {
        root: {
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 6px 16px rgba(0, 0, 0, 0.1)",
          },
        },
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="midnight">
          <MantineProvider theme={theme} defaultColorScheme="light">
            {children}
          </MantineProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
