"use client";

import { useState, useCallback } from "react";

export function useCoinSelector(initialCoin = "BTC") {
  const [coin, setCoin] = useState(initialCoin);

  const selectCoin = useCallback((newCoin: string) => {
    setCoin(newCoin.toUpperCase());
  }, []);

  return { coin, selectCoin };
}
