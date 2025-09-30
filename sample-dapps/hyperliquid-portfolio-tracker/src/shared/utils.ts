import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from './supabase';

// Tailwind class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format wallet address for display (0x123...abc)
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Signal the indexer to switch to a new wallet via database
export const switchIndexerWallet = async (walletAddress: string): Promise<void> => {
  try {
    // 1. Cancel any existing pending/processing requests to handle rapid searches
    await supabase
      .from('wallet_switch_requests')
      .update({ status: 'cancelled' })
      .in('status', ['pending', 'processing']);

    // 2. Clear old wallet data immediately to prevent stale data carryover
    await Promise.all([
      supabase.from('asset_positions').delete().neq('wallet_address', walletAddress),
      supabase.from('user_vault_equities').delete().neq('user_address', walletAddress),
      supabase.from('spot_balances').delete().neq('user_address', walletAddress),
      supabase.from('user_rate_limits').delete().neq('user_address', walletAddress),
      supabase.from('delegations').delete().neq('user_address', walletAddress),
      supabase.from('clearinghouse_states').delete().neq('wallet_address', walletAddress)
    ]);

    // 3. Insert new wallet switch request
    const { error } = await supabase
      .from('wallet_switch_requests')
      .insert({
        requested_wallet_address: walletAddress,
        status: 'pending'
      })
      .select();

    if (error) {
      throw error;
    }

  } catch (error) {
    throw error;
  }
};