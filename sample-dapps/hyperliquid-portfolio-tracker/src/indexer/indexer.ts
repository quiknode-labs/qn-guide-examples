import { createClient } from '@supabase/supabase-js';
import { HyperliquidAPI } from './apicalls.ts';
import { ClearinghouseStateResponse, UserRateLimitResponse, UserVaultEquityResponse, SpotClearinghouseStateResponse, DelegationResponse } from '../shared/types.ts';
import fs from 'fs';
import path from 'path';

// Current wallet address - starts empty until user provides one
let CURRENT_WALLET_ADDRESS = '';


// Lock file to prevent multiple indexers
const LOCK_FILE = path.join(process.cwd(), '.indexer.lock');

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
);

const hyperliquidAPI = new HyperliquidAPI();

function createLock(): boolean {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockData = fs.readFileSync(LOCK_FILE, 'utf8');
      const { pid, timestamp } = JSON.parse(lockData);

      // Check if the process is still running
      try {
        process.kill(pid, 0);
        console.error(`❌ Another indexer is already running (PID: ${pid})`);
        console.error(`   Started at: ${new Date(timestamp).toISOString()}`);
        return false;
      } catch (e) {
        // Process is dead, remove stale lock
        console.log(`🧹 Removing stale lock file (PID ${pid} no longer exists)`);
        fs.unlinkSync(LOCK_FILE);
      }
    }

    // Create lock file
    const lockData = {
      pid: process.pid,
      timestamp: Date.now(),
      wallet: CURRENT_WALLET_ADDRESS
    };

    fs.writeFileSync(LOCK_FILE, JSON.stringify(lockData, null, 2));
    console.log(`🔒 Created lock file for PID ${process.pid}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create lock file:', error);
    return false;
  }
}

async function removeLock(): Promise<void> {
  try {
    // Clear all trading data tables to ensure fresh start
    console.log('🧹 Clearing all trading data on shutdown...');

    // Clear wallet switch requests table
    const { error: switchError } = await supabase
      .from('wallet_switch_requests')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (switchError) {
      console.error('⚠️ Failed to clear wallet switch requests:', switchError.message);
    } else {
      console.log('✅ Cleared wallet switch requests table');
    }

    // Clear all trading data tables in correct order (children first due to foreign key constraints)
    const { error: positionsError } = await supabase
      .from('asset_positions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    const { error: vaultError } = await supabase
      .from('user_vault_equities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    const { error: rateLimitError } = await supabase
      .from('user_rate_limits')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    const { error: statesError } = await supabase
      .from('clearinghouse_states')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (positionsError || vaultError || rateLimitError || statesError) {
      console.error('⚠️ Some errors occurred clearing trading data:', {
        positionsError: positionsError?.message,
        vaultError: vaultError?.message,
        rateLimitError: rateLimitError?.message,
        statesError: statesError?.message
      });
    } else {
      console.log('✅ Cleared all trading data tables');
    }

    // Remove lock file
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
      console.log(`🔓 Removed lock file`);
    }

    console.log('🎯 Clean shutdown completed - ready for fresh start');
  } catch (error) {
    console.error('⚠️ Failed to cleanup on shutdown:', error);
  }
}

function removeLockSync(): void {
  try {
    // Remove lock file (synchronous cleanup for process exit)
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
      console.log(`🔓 Removed lock file`);
    }
  } catch (error) {
    console.error('⚠️ Failed to remove lock file:', error);
  }
}

class MinimalIndexer {
  private parseNumericValue(value: string): number {
    // Convert string to number, let PostgreSQL DECIMAL columns handle precision
    return parseFloat(value) || 0;
  }

  public async switchWallet(newWalletAddress: string): Promise<void> {
    console.log(`[${new Date().toISOString()}] 🔄 Switching to wallet: ${newWalletAddress}`);

    // Clear existing data for clean switch
    await this.clearAllWalletData();

    // Update current wallet address
    CURRENT_WALLET_ADDRESS = newWalletAddress;

    console.log(`[${new Date().toISOString()}] Starting data indexing for ${newWalletAddress}...`);
  }

  public async clearAllWalletData(): Promise<void> {
    try {
      // Clear all tables in correct order (children first due to foreign key constraints)
      await supabase.from('asset_positions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('user_vault_equities').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('user_rate_limits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('spot_balances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('delegations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('clearinghouse_states').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      console.log(`[${new Date().toISOString()}] 🧹 Cleared all wallet data from database`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error clearing wallet data:`, error);
      throw error;
    }
  }

  private async storeClearinghouseState(data: ClearinghouseStateResponse): Promise<string | null> {
    try {
      const record = {
        wallet_address: CURRENT_WALLET_ADDRESS,
        account_value: this.parseNumericValue(data.marginSummary.accountValue),
        total_margin_used: this.parseNumericValue(data.marginSummary.totalMarginUsed),
        withdrawable: this.parseNumericValue(data.withdrawable),
        timestamp: data.time
      };

      const { data: insertedData, error } = await supabase
        .from('clearinghouse_states')
        .insert(record)
        .select('id')
        .single();

      if (error) {
        console.error('Error storing clearinghouse state:', error);
        return null;
      }

      return insertedData.id;
    } catch (error) {
      console.error('Error storing clearinghouse state:', error);
      return null;
    }
  }

  private async storeAssetPositions(
    positions: ClearinghouseStateResponse['assetPositions'],
    timestamp: number
  ): Promise<void> {
    try {
      // Use a transaction to make delete-insert atomic, preventing UI flicker
      const { error: transactionError } = await supabase.rpc('replace_asset_positions', {
        p_wallet_address: CURRENT_WALLET_ADDRESS,
        p_positions: positions.map(pos => ({
          wallet_address: CURRENT_WALLET_ADDRESS,
          coin: pos.position.coin,
          size: this.parseNumericValue(pos.position.szi),
          leverage_type: pos.position.leverage.type,
          leverage_value: pos.position.leverage.value,
          entry_price: this.parseNumericValue(pos.position.entryPx),
          position_value: this.parseNumericValue(pos.position.positionValue),
          unrealized_pnl: this.parseNumericValue(pos.position.unrealizedPnl),
          liquidation_price: pos.position.liquidationPx ? this.parseNumericValue(pos.position.liquidationPx) : undefined,
          margin_used: this.parseNumericValue(pos.position.marginUsed),
          timestamp
        }))
      });

      if (transactionError) {
        console.error('Error in atomic position replacement:', transactionError);
        // Fallback to original method if RPC function doesn't exist yet
        await this.storeAssetPositionsFallback(positions);
      }
    } catch (error) {
      console.error('Error storing asset positions:', error);
      // Fallback to original method
      await this.storeAssetPositionsFallback(positions);
    }
  }

  private async storeAssetPositionsFallback(
    positions: ClearinghouseStateResponse['assetPositions']
  ): Promise<void> {
    try {
      // First, delete all existing positions for this wallet to ensure fresh data
      const { error: deleteError } = await supabase
        .from('asset_positions')
        .delete()
        .eq('wallet_address', CURRENT_WALLET_ADDRESS);

      if (deleteError) {
        console.error('Error deleting existing asset positions:', deleteError);
        return;
      }

      // If no positions to insert, we're done (all positions were closed)
      if (positions.length === 0) {
        return;
      }

      // Insert fresh position data
      const positionRecords = positions.map(pos => ({
        wallet_address: CURRENT_WALLET_ADDRESS,
        coin: pos.position.coin,
        size: this.parseNumericValue(pos.position.szi),
        leverage_type: pos.position.leverage.type,
        leverage_value: pos.position.leverage.value,
        entry_price: this.parseNumericValue(pos.position.entryPx),
        position_value: this.parseNumericValue(pos.position.positionValue),
        unrealized_pnl: this.parseNumericValue(pos.position.unrealizedPnl),
        liquidation_price: pos.position.liquidationPx ? this.parseNumericValue(pos.position.liquidationPx) : undefined,
        margin_used: this.parseNumericValue(pos.position.marginUsed)
      }));

      const { error: insertError } = await supabase
        .from('asset_positions')
        .insert(positionRecords);

      if (insertError) {
        console.error('Error inserting asset positions:', insertError);
      }
    } catch (error) {
      console.error('Error storing asset positions:', error);
    }
  }


  async checkForWalletSwitch(): Promise<void> {
    try {
      // First, clean up any stuck processing requests (older than 30 seconds)
      const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
      await supabase
        .from('wallet_switch_requests')
        .update({ status: 'pending' })
        .eq('status', 'processing')
        .lt('created_at', thirtySecondsAgo);

      // Check for pending wallet switch requests
      const { data: switchRequests, error } = await supabase
        .from('wallet_switch_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(`[${new Date().toISOString()}] Error checking wallet switch requests:`, error);
        return;
      }

      if (switchRequests && switchRequests.requested_wallet_address !== CURRENT_WALLET_ADDRESS) {
        const newWallet = switchRequests.requested_wallet_address;
        const requestId = switchRequests.id;
        console.log(`[${new Date().toISOString()}] 📨 Processing wallet switch request: ${newWallet}`);

        try {
          // Update request status to processing
          const { error: updateError } = await supabase
            .from('wallet_switch_requests')
            .update({ status: 'processing' })
            .eq('id', requestId);

          if (updateError) {
            console.error(`[${new Date().toISOString()}] Failed to mark request as processing:`, updateError);
            return;
          }

          // Switch wallet
          await this.switchWallet(newWallet);
          console.log(`[${new Date().toISOString()}] ✅ Successfully switched to wallet: ${newWallet}`);

          // Mark request as completed
          const { error: completeError } = await supabase
            .from('wallet_switch_requests')
            .update({ status: 'completed' })
            .eq('id', requestId);

          if (completeError) {
            console.error(`[${new Date().toISOString()}] Failed to mark request as completed:`, completeError);
          }

        } catch (switchError) {
          console.error(`[${new Date().toISOString()}] Error during wallet switch:`, switchError);

          // Mark request as failed for debugging
          await supabase
            .from('wallet_switch_requests')
            .update({ status: 'failed' })
            .eq('id', requestId);
        }

        // Clean up old requests (keep only last 10 completed/failed requests, delete cancelled immediately)
        await supabase
          .from('wallet_switch_requests')
          .delete()
          .eq('status', 'cancelled');

        const { data: allRequests } = await supabase
          .from('wallet_switch_requests')
          .select('id')
          .in('status', ['completed', 'failed'])
          .order('created_at', { ascending: false });

        if (allRequests && allRequests.length > 10) {
          const oldRequestIds = allRequests.slice(10).map(req => req.id);
          await supabase
            .from('wallet_switch_requests')
            .delete()
            .in('id', oldRequestIds);
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Critical error in wallet switch check:`, error);
    }
  }

  private async storeUserRateLimit(rateLimitData: UserRateLimitResponse, timestamp: number): Promise<void> {
    if (!rateLimitData) return;

    try {
      const record = {
        user_address: CURRENT_WALLET_ADDRESS,
        cum_vlm: this.parseNumericValue(rateLimitData.cumVlm),
        timestamp
      };

      const { error } = await supabase
        .from('user_rate_limits')
        .upsert(record, {
          onConflict: 'user_address'
        });

      if (error) {
        console.error('Error storing user rate limit:', error);
      }
    } catch (error) {
      console.error('Error storing user rate limit:', error);
    }
  }

  private async storeUserVaultEquities(vaultEquities: UserVaultEquityResponse[], timestamp: number): Promise<void> {
    const logPrefix = `[${new Date().toISOString()}] VAULT`;

    if (!vaultEquities || vaultEquities.length === 0) {
      console.log(`${logPrefix} No vault data to process (empty array)`);
      return;
    }

    console.log(`${logPrefix} Processing ${vaultEquities.length} vault entries for ${CURRENT_WALLET_ADDRESS}`);

    try {
      // Upsert all vault records directly using unique constraint
      const allRecords = vaultEquities.map(vault => ({
        user_address: CURRENT_WALLET_ADDRESS,
        vault_address: vault.vaultAddress,
        equity: this.parseNumericValue(vault.equity),
        locked_until_timestamp: vault.lockedUntilTimestamp,
        timestamp
      }));

      const { data: insertedData, error } = await supabase
        .from('user_vault_equities')
        .upsert(allRecords, {
          onConflict: 'user_address,vault_address'
        })
        .select('id');

      if (error) {
        console.error(`${logPrefix} ❌ Database error:`, error);
      } else {
        console.log(`${logPrefix} ✅ Inserted ${insertedData?.length || 0} vault entries for ${CURRENT_WALLET_ADDRESS}`);
      }
    } catch (error) {
      console.error(`${logPrefix} ❌ Unexpected error:`, error);
    }
  }

  private async storeSpotBalances(spotData: SpotClearinghouseStateResponse, timestamp: number): Promise<void> {
    const logPrefix = `[${new Date().toISOString()}] SPOT`;

    if (!spotData?.balances || spotData.balances.length === 0) {
      console.log(`${logPrefix} No spot balance data to process (empty array)`);
      return;
    }

    try {
      // Upsert spot balances directly using unique constraint
      const records = spotData.balances.map(balance => ({
        user_address: CURRENT_WALLET_ADDRESS,
        coin: balance.coin,
        token: balance.token,
        total: this.parseNumericValue(balance.total),
        entry_ntl: this.parseNumericValue(balance.entryNtl),
        timestamp
      }));

      const { data: insertedData, error } = await supabase
        .from('spot_balances')
        .upsert(records, {
          onConflict: 'user_address,token'
        })
        .select('id');

      if (error) {
        console.error(`${logPrefix} ❌ Database error:`, error);
      } else {
        console.log(`${logPrefix} ✅ Inserted ${insertedData?.length || 0} spot balance entries for ${CURRENT_WALLET_ADDRESS}`);
      }
    } catch (error) {
      console.error(`${logPrefix} ❌ Unexpected error:`, error);
    }
  }

  private async storeDelegations(delegations: DelegationResponse[], timestamp: number): Promise<void> {
    const logPrefix = `[${new Date().toISOString()}] DELEGATIONS`;

    if (!delegations || delegations.length === 0) {
      console.log(`${logPrefix} No delegation data to process (empty array)`);
      return;
    }

    try {
      // Upsert delegations directly using unique constraint
      const records = delegations.map(delegation => ({
        user_address: CURRENT_WALLET_ADDRESS,
        validator: delegation.validator,
        amount: this.parseNumericValue(delegation.amount),
        locked_until_timestamp: delegation.lockedUntilTimestamp,
        timestamp
      }));

      const { data: insertedData, error } = await supabase
        .from('delegations')
        .upsert(records, {
          onConflict: 'user_address,validator'
        })
        .select('id');

      if (error) {
        console.error(`${logPrefix} ❌ Database error:`, error);
      } else {
        console.log(`${logPrefix} ✅ Inserted ${insertedData?.length || 0} delegation entries for ${CURRENT_WALLET_ADDRESS}`);
      }
    } catch (error) {
      console.error(`${logPrefix} ❌ Unexpected error:`, error);
    }
  }

  async indexData(): Promise<void> {
    // Skip indexing if no wallet address is set
    if (!CURRENT_WALLET_ADDRESS) {
      return;
    }

    try {
      console.log(`[${new Date().toISOString()}] Starting data indexing for ${CURRENT_WALLET_ADDRESS}...`);

      const timestamp = Date.now();

      // Fetch clearinghouse state
      const data = await hyperliquidAPI.getClearinghouseState(CURRENT_WALLET_ADDRESS);
      const stateId = await this.storeClearinghouseState(data);

      // Fetch and store user rate limit
      try {
        const rateLimitData = await hyperliquidAPI.getUserRateLimit(CURRENT_WALLET_ADDRESS);
        await this.storeUserRateLimit(rateLimitData, timestamp);
      } catch (error) {
        console.log(`[${new Date().toISOString()}] No rate limit data available for ${CURRENT_WALLET_ADDRESS}`);
      }

      // Fetch user vault equities every second, but only store when data changes
      try {
        const vaultEquitiesData = await hyperliquidAPI.getUserVaultEquities(CURRENT_WALLET_ADDRESS);
        await this.storeUserVaultEquities(vaultEquitiesData, timestamp);
      } catch (error) {
        console.log(`[${new Date().toISOString()}] No vault equities data available for ${CURRENT_WALLET_ADDRESS}`);
      }

      // Fetch and store spot clearinghouse state
      try {
        const spotData = await hyperliquidAPI.getSpotClearinghouseState(CURRENT_WALLET_ADDRESS);
        await this.storeSpotBalances(spotData, timestamp);
      } catch (error) {
        console.log(`[${new Date().toISOString()}] No spot balance data available for ${CURRENT_WALLET_ADDRESS}`);
      }

      // Fetch and store delegations
      try {
        const delegationsData = await hyperliquidAPI.getDelegations(CURRENT_WALLET_ADDRESS);
        await this.storeDelegations(delegationsData, timestamp);
      } catch (error) {
        console.log(`[${new Date().toISOString()}] No delegation data available for ${CURRENT_WALLET_ADDRESS}`);
      }

      // Store asset positions
      if (stateId) {
        await this.storeAssetPositions(data.assetPositions, data.time);
        console.log(`[${new Date().toISOString()}] Successfully indexed data - Account Value: $${data.marginSummary.accountValue}, Positions: ${data.assetPositions.length}`);
      } else {
        console.error(`[${new Date().toISOString()}] Failed to store clearinghouse state`);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error during indexing:`, error);
    }
  }
}

// Check for existing lock before starting
if (!createLock()) {
  console.error(`[${new Date().toISOString()}] 🚫 Indexer startup failed - another instance is already running`);
  process.exit(1);
}

const indexer = new MinimalIndexer();

// Clear any stale data on startup to ensure fresh start
async function initializeIndexer() {
  console.log(`[${new Date().toISOString()}] 🧹 Clearing stale data on startup...`);

  // Reset wallet address to ensure fresh start
  CURRENT_WALLET_ADDRESS = '';

  // Clear all trading data from previous sessions
  await indexer.clearAllWalletData();

  // Also clear wallet switch requests table
  const { error } = await supabase
    .from('wallet_switch_requests')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (error) {
    console.error('⚠️ Failed to clear wallet switch requests on startup:', error.message);
  } else {
    console.log('✅ Cleared wallet switch requests table on startup');
  }

  console.log(`[${new Date().toISOString()}] 🚀 Minimal Clearinghouse Indexer started`);
  console.log(`[${new Date().toISOString()}] 📊 Waiting for wallet address to be provided`);
  console.log(`[${new Date().toISOString()}] ⏰ Will index every second once wallet is set`);
}

// Initialize with clean state
initializeIndexer();

// Run indexing every 500ms for high-frequency data collection (faster than frontend)
const startIndexer = () => {
  setInterval(async () => {
    // Check for wallet switch signals before each indexing cycle
    await indexer.checkForWalletSwitch();
    await indexer.indexData();
  }, 500); // 500ms = twice as fast as frontend queries
};

// Start the indexer
startIndexer();

// Keep the process running
process.on('SIGINT', async () => {
  console.log(`[${new Date().toISOString()}] 👋 Shutting down gracefully...`);
  await indexer.clearAllWalletData();
  await removeLock();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(`[${new Date().toISOString()}] 👋 Shutting down gracefully...`);
  await indexer.clearAllWalletData();
  await removeLock();
  process.exit(0);
});

// Clean up on unexpected exit
process.on('exit', () => {
  removeLockSync();
});