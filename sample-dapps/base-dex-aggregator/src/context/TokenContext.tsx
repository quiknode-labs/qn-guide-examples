import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { fetchTokenList, fetchTokenBalance } from "../lib/api";
import type { Token } from "../types";
import { useAccount } from "wagmi";

interface TokenContextType {
  tokens: Token[];
  isLoading: boolean;
  error: Error | null;
  fromToken: Token | null;
  toToken: Token | null;
  setFromToken: (token: Token) => void;
  setToToken: (token: Token) => void;
  tokenBalances: Record<string, string>;
  refreshBalances: () => Promise<void>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

// Cache token list in memory
let cachedTokens: Token[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes

// Helper to sort tokens by popularity
function sortTokensByPopularity(tokens: Token[]): Token[] {
  // Define popular token symbols in order of priority
  const popularSymbols = ["ETH", "USDC", "USDT", "WETH", "DAI", "WBTC"];

  return [...tokens].sort((a, b) => {
    const aIndex = popularSymbols.indexOf(a.symbol);
    const bIndex = popularSymbols.indexOf(b.symbol);

    // If both tokens are in the popular list, sort by their position in the list
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    // If only one token is in the popular list, prioritize it
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;

    // Otherwise, sort alphabetically by symbol
    return a.symbol.localeCompare(b.symbol);
  });
}

export function TokenProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>(
    {}
  );

  // Use useCallback to prevent refreshBalances from being recreated on each render
  const refreshBalances = useCallback(async () => {
    if (!address) return;

    // Only fetch balances for selected tokens
    const tokensToFetch: Token[] = [];
    if (fromToken) tokensToFetch.push(fromToken);
    if (toToken && toToken.address !== fromToken?.address)
      tokensToFetch.push(toToken);

    if (tokensToFetch.length === 0) return;

    const newBalances: Record<string, string> = {};

    for (const token of tokensToFetch) {
      try {
        const balance = await fetchTokenBalance(
          token.address,
          address,
          token.decimals
        );
        newBalances[token.address] = balance;
      } catch (err) {
        console.error(`Error fetching balance for ${token.symbol}:`, err);
      }
    }

    setTokenBalances(newBalances);
  }, [address, fromToken, toToken]);

  // Load tokens only once
  useEffect(() => {
    async function loadTokens() {
      try {
        setIsLoading(true);

        // Check if we have a valid cached token list
        const now = Date.now();
        if (cachedTokens && now - lastFetchTime < CACHE_DURATION) {
          const sortedTokens = sortTokensByPopularity(cachedTokens);
          setTokens(sortedTokens);

          // Set default tokens
          const ethToken = sortedTokens.find((t) => t.symbol === "ETH");
          const usdcToken = sortedTokens.find((t) => t.symbol === "USDC");

          setFromToken(ethToken || sortedTokens[0]);
          setToToken(
            usdcToken ||
              (sortedTokens.length > 1 ? sortedTokens[1] : sortedTokens[0])
          );

          setIsLoading(false);
          return;
        }

        // Fetch new token list if cache is invalid
        const tokenList = await fetchTokenList();
        cachedTokens = tokenList;
        lastFetchTime = now;

        const sortedTokens = sortTokensByPopularity(tokenList);
        setTokens(sortedTokens);

        // Set default tokens
        const ethToken = sortedTokens.find((t) => t.symbol === "ETH");
        const usdcToken = sortedTokens.find((t) => t.symbol === "USDC");

        setFromToken(ethToken || sortedTokens[0]);
        setToToken(
          usdcToken ||
            (sortedTokens.length > 1 ? sortedTokens[1] : sortedTokens[0])
        );
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load tokens")
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadTokens();
  }, []);

  // Fetch balances when address changes
  useEffect(() => {
    if (address) {
      refreshBalances();
    }
  }, [address, refreshBalances]);

  // Simple token setters without automatic balance fetching
  const handleSetFromToken = (token: Token) => {
    setFromToken(token);
  };

  const handleSetToToken = (token: Token) => {
    setToToken(token);
  };

  return (
    <TokenContext.Provider
      value={{
        tokens,
        isLoading,
        error,
        fromToken,
        toToken,
        setFromToken: handleSetFromToken,
        setToToken: handleSetToToken,
        tokenBalances,
        refreshBalances,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

export function useTokenContext() {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useTokenContext must be used within a TokenProvider");
  }
  return context;
}
