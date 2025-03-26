import { address, Address } from "@solana/kit";

export const WRAPPED_SOL_ADDRESS = address(
  "So11111111111111111111111111111111111111112"
);

// TODO update to METIS
const JUPITER_PRICE_ENDPOINT = "https://api.jup.ag/price/v2";

interface LastSwappedPrice {
  lastJupiterSellAt: number;
  lastJupiterSellPrice: string;
  lastJupiterBuyAt: number;
  lastJupiterBuyPrice: string;
}

interface QuotedPrice {
  buyPrice: string;
  buyAt: number;
  sellPrice: string;
  sellAt: number;
}

interface DepthRatio {
  depth: {
    "10": number;
    "100": number;
    "1000": number;
  };
  timestamp: number;
}

interface PriceDepth {
  buyPriceImpactRatio: DepthRatio;
  sellPriceImpactRatio: DepthRatio;
}

interface ExtraInfo {
  lastSwappedPrice: LastSwappedPrice;
  quotedPrice: QuotedPrice;
  confidenceLevel: "high" | "medium" | "low";
  depth: PriceDepth;
}

interface TokenPrice {
  id: string;
  type: string;
  price: string;
  extraInfo?: ExtraInfo;
}

interface JupiterPriceResponse {
  data: Record<Address, TokenPrice>;
  timeTaken: number;
}

interface FetchTokenPricesOptions {
  showExtraInfo?: boolean;
}

export const fetchSolanaPrice = async (
  options: FetchTokenPricesOptions = {}
): Promise<JupiterPriceResponse> => {
  try {
    const url = new URL(JUPITER_PRICE_ENDPOINT);
    url.searchParams.set("ids", WRAPPED_SOL_ADDRESS);

    if (options.showExtraInfo) {
      url.searchParams.set("showExtraInfo", "true");
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching price:", error);
    throw error;
  }
};

export function formatUsdPrice(
  solAmount: number | string,
  solPrice: number | string
): string {
  const solAmountNum = solAmount === "" ? 0 : parseFloat(solAmount as string);
  const solPriceNum = solPrice === "" ? 0 : parseFloat(solPrice as string);
  const usdValue = solAmountNum * solPriceNum;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(usdValue);
}
