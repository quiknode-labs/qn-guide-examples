"use client"

import { useMemo } from "react"
import { OUTCOME_TOKENS } from "@/lib/token-config"

export function useOutcomeTokens(chainId: number) {
  const tokens = useMemo(() => {
    return OUTCOME_TOKENS[chainId] || OUTCOME_TOKENS[8453]
  }, [chainId])

  return {
    tokens,
    loading: false,
    error: null,
  }
}
