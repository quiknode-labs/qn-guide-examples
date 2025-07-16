import type { DetailedPool } from "@/types/pool"

export const mockPools: DetailedPool[] = [
  {
    address: "0x1234567890123456789012345678901234567890",
    symbol: "USDC/USDbC",
    factory: "0xfactory1",
    type_info: {
      type: 0,
      is_stable: true,
      is_cl: false,
      label: "Stable",
      decimals: 18,
    },
    tokens: {
      token0: { address: "0xusdc", symbol: "USDC", decimals: 6 },
      token1: { address: "0xusdbc", symbol: "USDbC", decimals: 6 },
    },
    liquidity: {
      tvl: 45000000,
      total_supply: "45000000000000000000000000",
      reserves: {
        token0_amount: 22500000,
        token1_amount: 22500000,
      },
    },
    trading: {
      volume_24h: 2500000,
      fees_24h: 2500,
      apr: 8.5,
      pool_fee_bps: 1,
      pool_fee_percentage: 0.01,
    },
    gauge: {
      total_supply: "1000000000000000000000000",
      emissions_per_second: 0.5,
      weekly_emissions: 302400,
    },
    voting: {
      votes: "5000000000000000000000000",
      emissions: 302400,
      rewards: {
        fees: { total_usd: 2500, tokens: [] },
        incentives: { total_usd: 15000, tokens: [] },
      },
    },
  },
  {
    address: "0x2345678901234567890123456789012345678901",
    symbol: "ETH/USDC",
    factory: "0xfactory1",
    type_info: {
      type: 1,
      is_stable: false,
      is_cl: false,
      label: "Volatile",
      decimals: 18,
    },
    tokens: {
      token0: { address: "0xeth", symbol: "ETH", decimals: 18 },
      token1: { address: "0xusdc", symbol: "USDC", decimals: 6 },
    },
    liquidity: {
      tvl: 32000000,
      total_supply: "32000000000000000000000000",
      reserves: {
        token0_amount: 8000,
        token1_amount: 24000000,
      },
    },
    trading: {
      volume_24h: 5200000,
      fees_24h: 15600,
      apr: 18.2,
      pool_fee_bps: 30,
      pool_fee_percentage: 0.3,
    },
    gauge: {
      total_supply: "800000000000000000000000",
      emissions_per_second: 0.8,
      weekly_emissions: 483840,
    },
    voting: {
      votes: "8000000000000000000000000",
      emissions: 483840,
      rewards: {
        fees: { total_usd: 3500, tokens: [] },
        incentives: { total_usd: 25000, tokens: [] },
      },
    },
  },
  {
    address: "0x3456789012345678901234567890123456789012",
    symbol: "WBTC/ETH",
    factory: "0xfactory1",
    type_info: {
      type: 1,
      is_stable: false,
      is_cl: false,
      label: "Volatile",
      decimals: 18,
    },
    tokens: {
      token0: { address: "0xwbtc", symbol: "WBTC", decimals: 8 },
      token1: { address: "0xeth", symbol: "ETH", decimals: 18 },
    },
    liquidity: {
      tvl: 18500000,
      total_supply: "18500000000000000000000000",
      reserves: {
        token0_amount: 300,
        token1_amount: 4625,
      },
    },
    trading: {
      volume_24h: 3100000,
      fees_24h: 9300,
      apr: 22.8,
      pool_fee_bps: 30,
      pool_fee_percentage: 0.3,
    },
    gauge: {
      total_supply: "600000000000000000000000",
      emissions_per_second: 0.6,
      weekly_emissions: 362880,
    },
    voting: {
      votes: "6000000000000000000000000",
      emissions: 362880,
      rewards: {
        fees: { total_usd: 9300, tokens: [] },
        incentives: { total_usd: 18000, tokens: [] },
      },
    },
  },
  {
    address: "0x4567890123456789012345678901234567890123",
    symbol: "AERO/USDC",
    factory: "0xfactory1",
    type_info: {
      type: 1,
      is_stable: false,
      is_cl: false,
      label: "Volatile",
      decimals: 18,
    },
    tokens: {
      token0: { address: "0xaero", symbol: "AERO", decimals: 18 },
      token1: { address: "0xusdc", symbol: "USDC", decimals: 6 },
    },
    liquidity: {
      tvl: 12800000,
      total_supply: "12800000000000000000000000",
      reserves: {
        token0_amount: 8000000,
        token1_amount: 4800000,
      },
    },
    trading: {
      volume_24h: 1800000,
      fees_24h: 5400,
      apr: 35.6,
      pool_fee_bps: 30,
      pool_fee_percentage: 0.3,
    },
    gauge: {
      total_supply: "400000000000000000000000",
      emissions_per_second: 1.2,
      weekly_emissions: 725760,
    },
    voting: {
      votes: "12000000000000000000000000",
      emissions: 725760,
      rewards: {
        fees: { total_usd: 5000, tokens: [] },
        incentives: { total_usd: 25000, tokens: [] },
      },
    },
  },
  {
    address: "0x5678901234567890123456789012345678901234",
    symbol: "DAI/USDC",
    factory: "0xfactory1",
    type_info: {
      type: 0,
      is_stable: true,
      is_cl: false,
      label: "Stable",
      decimals: 18,
    },
    tokens: {
      token0: { address: "0xdai", symbol: "DAI", decimals: 18 },
      token1: { address: "0xusdc", symbol: "USDC", decimals: 6 },
    },
    liquidity: {
      tvl: 8200000,
      total_supply: "8200000000000000000000000",
      reserves: {
        token0_amount: 4100000,
        token1_amount: 4100000,
      },
    },
    trading: {
      volume_24h: 650000,
      fees_24h: 650,
      apr: 6.8,
      pool_fee_bps: 1,
      pool_fee_percentage: 0.01,
    },
    gauge: {
      total_supply: "300000000000000000000000",
      emissions_per_second: 0.3,
      weekly_emissions: 181440,
    },
    voting: {
      votes: "3000000000000000000000000",
      emissions: 181440,
      rewards: {
        fees: { total_usd: 2500, tokens: [] },
        incentives: { total_usd: 15000, tokens: [] },
      },
    },
  },
  {
    address: "0x6789012345678901234567890123456789012345",
    symbol: "cbETH/ETH",
    factory: "0xfactory1",
    type_info: {
      type: 0,
      is_stable: true,
      is_cl: false,
      label: "Stable",
      decimals: 18,
    },
    tokens: {
      token0: { address: "0xcbeth", symbol: "cbETH", decimals: 18 },
      token1: { address: "0xeth", symbol: "ETH", decimals: 18 },
    },
    liquidity: {
      tvl: 15600000,
      total_supply: "15600000000000000000000000",
      reserves: {
        token0_amount: 3900,
        token1_amount: 3900,
      },
    },
    trading: {
      volume_24h: 980000,
      fees_24h: 980,
      apr: 12.4,
      pool_fee_bps: 1,
      pool_fee_percentage: 0.01,
    },
    gauge: {
      total_supply: "500000000000000000000000",
      emissions_per_second: 0.4,
      weekly_emissions: 241920,
    },
    voting: {
      votes: "4000000000000000000000000",
      emissions: 241920,
      rewards: {
        fees: { total_usd: 2500, tokens: [] },
        incentives: { total_usd: 15000, tokens: [] },
      },
    },
  },
];
