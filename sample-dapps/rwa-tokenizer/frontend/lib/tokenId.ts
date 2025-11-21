/**
 * Token ID Utilities
 *
 * Token IDs are chain-encoded to prevent collisions across chains:
 * Format: (chainEid * 1,000,000,000) + localTokenId
 *
 * Examples:
 * - Base Sepolia (EID 40245) token #1 = 40,245,000,000,001
 * - Sepolia (EID 40161) token #1 = 40,161,000,000,001
 */

const CHAIN_ID_MULTIPLIER = 1_000_000_000

/**
 * Chain EID to name mapping
 */
const CHAIN_NAMES: Record<number, string> = {
  40245: 'Base Sepolia',
  40161: 'Ethereum Sepolia',
  // Add more chains as needed
}

/**
 * Short chain names for compact display
 */
const CHAIN_SHORT_NAMES: Record<number, string> = {
  40245: 'Base',
  40161: 'Sepolia',
}

/**
 * Extract the origin chain EID from a token ID
 */
export function getOriginChainEid(tokenId: bigint): number {
  return Number(tokenId / BigInt(CHAIN_ID_MULTIPLIER))
}

/**
 * Extract the local token ID from a global token ID
 */
export function getLocalTokenId(tokenId: bigint): number {
  return Number(tokenId % BigInt(CHAIN_ID_MULTIPLIER))
}

/**
 * Get the chain name from a chain EID
 */
export function getChainName(chainEid: number): string {
  return CHAIN_NAMES[chainEid] || `Chain ${chainEid}`
}

/**
 * Get the short chain name from a chain EID
 */
export function getChainShortName(chainEid: number): string {
  return CHAIN_SHORT_NAMES[chainEid] || `Chain ${chainEid}`
}

/**
 * Extract the origin chain name from a token ID
 */
export function extractChainName(tokenId: bigint): string {
  const chainEid = getOriginChainEid(tokenId)
  return getChainName(chainEid)
}

/**
 * Extract the short origin chain name from a token ID
 */
export function extractChainShortName(tokenId: bigint): string {
  const chainEid = getOriginChainEid(tokenId)
  return getChainShortName(chainEid)
}

/**
 * Format a token ID for display (e.g., "Base #1")
 */
export function formatTokenId(tokenId: bigint): string {
  const chainShortName = extractChainShortName(tokenId)
  const localId = getLocalTokenId(tokenId)
  return `${chainShortName} #${localId}`
}

/**
 * Format a token ID with full chain name (e.g., "Base Sepolia #1")
 */
export function formatTokenIdLong(tokenId: bigint): string {
  const chainName = extractChainName(tokenId)
  const localId = getLocalTokenId(tokenId)
  return `${chainName} #${localId}`
}

/**
 * Check if a token was minted on a specific chain
 */
export function isTokenFromChain(tokenId: bigint, chainEid: number): boolean {
  return getOriginChainEid(tokenId) === chainEid
}

/**
 * Encode a local token ID with a chain EID
 */
export function encodeTokenId(chainEid: number, localTokenId: number): bigint {
  return BigInt(chainEid) * BigInt(CHAIN_ID_MULTIPLIER) + BigInt(localTokenId)
}

/**
 * Format token ID for display in tables (with tooltip data)
 */
export function formatTokenIdForTable(tokenId: bigint): {
  display: string
  full: string
  raw: string
  chainName: string
  localId: number
} {
  return {
    display: formatTokenId(tokenId),
    full: formatTokenIdLong(tokenId),
    raw: tokenId.toString(),
    chainName: extractChainName(tokenId),
    localId: getLocalTokenId(tokenId),
  }
}
