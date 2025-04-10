import { http, createConfig } from "wagmi";
import { monad } from "@/monad";
import { injected } from "wagmi/connectors";

// Wagmi config: only Monad
export const config = createConfig({
  chains: [monad],
  connectors: [
    injected(),
  ],
  transports: {
    [monad.id]: http(),
  },
});
