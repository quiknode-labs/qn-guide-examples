"use client";
import {
  Blink,
  useBlink,
  useActionsRegistryInterval,
} from "@dialectlabs/blinks";
import "@dialectlabs/blinks/index.css";
import { useEvmWagmiAdapter } from "@dialectlabs/blinks/hooks/evm";
import { useModal } from "connectkit";
import { StepCard } from "@/components/step-card";

// Text for the steps on the left side of the page for the user to follow
const steps = [
  {
    icon: "icon-cog",
    chip: {
      text: "Backend",
      icon: "icon-cog",
    },
    headline: "Blink API",
    text: "Blinks are headless APIs that return transactions, as well as educational metadata that can be used to render blink UIs. \n\nGet started by editing `/src/app/api/actions/mint-nft/route.ts`",
  },
  {
    icon: "icon-code",
    chip: {
      text: "Frontend",
      icon: "icon-code",
    },
    headline: "Blink UI",
    text: "Dialect's blinks UI components libraries can be used to render the blink data returned from the blink API backend. \n\nGet started by editing `src/app/page.tsx`",
  },
];

export default function Home() {
  // Actions registry interval
  useActionsRegistryInterval();

  // ConnectKit modal
  const { setOpen } = useModal();

  // Wagmi adapter, used to connect to the wallet
  const { adapter } = useEvmWagmiAdapter({
    onConnectWalletRequest: async () => {
      setOpen(true);
    },
  });

  // Action we want to execute in the Blink
  const { blink, isLoading } = useBlink({
    url: "evm-action:http://localhost:3000/api/actions/mint-nft",
  });

  return (
    <main className="grid grid-cols-[2fr_3fr] h-[calc(100vh-64px)]">
      <div className="col-span-1 p-8 pr-16 overflow-y-auto">
        <h1 className="text-[40px] mb-3 font-bold leading-[1]">
          Monad Blinks Starter Template
        </h1>
        <h2 className="text-[18px] mb-2">
          Use this template project to get started developing your blink.
        </h2>
        {steps.map((step, i) => (
          <StepCard
            key={i}
            chip={step.chip}
            headline={step.headline}
            text={step.text}
          />
        ))}
      </div>

      <div className=" flex items-center justify-center border border-gray-600 rounded-[10px] m-4">
        {isLoading || !blink ? (
          <span>Loading</span>
        ) : (
          <div className="w-full max-w-lg">
            <Blink
              blink={blink}
              adapter={adapter}
              securityLevel="all"
              stylePreset="x-dark"
            />
          </div>
        )}
      </div>
    </main>
  );
}
