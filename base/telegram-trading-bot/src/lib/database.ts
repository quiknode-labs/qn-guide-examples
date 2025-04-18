import Database from "better-sqlite3";
import { WalletData } from "../types/wallet";
import { UserSettings } from "../types/config";
import { DB_PATH, DB_TABLES } from "../utils/constants";

const db = new Database(DB_PATH);

// Define types for database rows
type UserRow = {
  userId: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: number;
};

type WalletRow = {
  address: string;
  userId: string;
  encryptedPrivateKey: string;
  type: string;
  createdAt: number;
};

type SettingsRow = {
  userId: string;
  slippage: number;
  gasPriority: string;
};

type TransactionRow = {
  txHash: string;
  userId: string;
  walletAddress: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string | null;
  status: string;
  gasUsed: string | null;
  timestamp: number;
};

// Initialize tables
export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ${DB_TABLES.USERS} (
      userId TEXT PRIMARY KEY,
      telegramId TEXT NOT NULL,
      username TEXT,
      firstName TEXT,
      lastName TEXT,
      createdAt INTEGER NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS ${DB_TABLES.WALLETS} (
      address TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      encryptedPrivateKey TEXT NOT NULL,
      type TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES ${DB_TABLES.USERS}(userId)
    );
    
    CREATE TABLE IF NOT EXISTS ${DB_TABLES.SETTINGS} (
      userId TEXT PRIMARY KEY,
      slippage REAL NOT NULL,
      gasPriority TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES ${DB_TABLES.USERS}(userId)
    );
    
    CREATE TABLE IF NOT EXISTS ${DB_TABLES.TRANSACTIONS} (
      txHash TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      walletAddress TEXT NOT NULL,
      fromToken TEXT NOT NULL,
      toToken TEXT NOT NULL,
      fromAmount TEXT NOT NULL,
      toAmount TEXT,
      status TEXT NOT NULL,
      gasUsed TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES ${DB_TABLES.USERS}(userId),
      FOREIGN KEY (walletAddress) REFERENCES ${DB_TABLES.WALLETS}(address)
    );
  `);
}

// User operations
export function createUser(
  userId: string,
  telegramId: string,
  username?: string,
  firstName?: string,
  lastName?: string
): void {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO ${DB_TABLES.USERS} (userId, telegramId, username, firstName, lastName, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(userId, telegramId, username, firstName, lastName, Date.now());
}

export function getUserByTelegramId(telegramId: string): UserRow | undefined {
  const stmt = db.prepare(`
    SELECT * FROM ${DB_TABLES.USERS} WHERE telegramId = ?
  `);

  return stmt.get(telegramId) as UserRow | undefined;
}

// Wallet operations
export function saveWallet(walletData: WalletData, userId: string): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ${DB_TABLES.WALLETS} (address, userId, encryptedPrivateKey, type, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    walletData.address,
    userId,
    walletData.encryptedPrivateKey,
    walletData.type,
    walletData.createdAt
  );
}

export function getWalletByUserId(userId: string): WalletData | null {
  const stmt = db.prepare(`
    SELECT * FROM ${DB_TABLES.WALLETS} WHERE userId = ?
  `);

  const result = stmt.get(userId) as WalletRow | undefined;
  return result ? (result as unknown as WalletData) : null;
}

export function getWalletByAddress(address: string): WalletData | null {
  const stmt = db.prepare(`
    SELECT * FROM ${DB_TABLES.WALLETS} WHERE address = ?
  `);

  const result = stmt.get(address) as WalletRow | undefined;
  return result ? (result as unknown as WalletData) : null;
}

export function deleteWallet(address: string): void {
  const stmt = db.prepare(`
    DELETE FROM ${DB_TABLES.WALLETS} WHERE address = ?
  `);

  stmt.run(address);
}

// Settings operations
export function saveUserSettings(
  userId: string,
  settings: Omit<UserSettings, "userId">
): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ${DB_TABLES.SETTINGS} (userId, slippage, gasPriority)
    VALUES (?, ?, ?)
  `);

  stmt.run(
    userId,
    settings.slippage,
    settings.gasPriority,
  );
}

export function getUserSettings(userId: string): UserSettings | null {
  const stmt = db.prepare(`
    SELECT * FROM ${DB_TABLES.SETTINGS} WHERE userId = ?
  `);

  const result = stmt.get(userId) as SettingsRow | undefined;

  if (!result) return null;

  return {
    userId,
    slippage: result.slippage,
    gasPriority: result.gasPriority as UserSettings["gasPriority"],
  };
}

// Transaction operations
export function saveTransaction(
  txHash: string,
  userId: string,
  walletAddress: string,
  fromToken: string,
  toToken: string,
  fromAmount: string,
  status: string,
  toAmount?: string,
  gasUsed?: string
): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ${DB_TABLES.TRANSACTIONS} (
      txHash, userId, walletAddress, fromToken, toToken, 
      fromAmount, toAmount, status, gasUsed, timestamp
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    txHash,
    userId,
    walletAddress,
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    status,
    gasUsed,
    Date.now()
  );
}

export function getTransactionsByUserId(
  userId: string,
  limit = 10
): TransactionRow[] {
  const stmt = db.prepare(`
    SELECT * FROM ${DB_TABLES.TRANSACTIONS} 
    WHERE userId = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);

  return stmt.all(userId, limit) as TransactionRow[];
}

export function getUniqueTokensByUserId(userId: string): string[] {
  const stmt = db.prepare(`
    SELECT DISTINCT fromToken AS token FROM ${DB_TABLES.TRANSACTIONS}
    WHERE userId = ?
    UNION
    SELECT DISTINCT toToken AS token FROM ${DB_TABLES.TRANSACTIONS}
    WHERE userId = ?
  `);

  const rows = stmt.all(userId, userId) as { token: string }[];

  return rows.map((row) => row.token);
}


// Close database connection
export function closeDatabase(): void {
  db.close();
}
