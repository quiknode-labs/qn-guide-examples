import { Context } from "grammy";
import { UserSettings } from "./config";

export interface SessionData {
  userId?: string;
  walletAddress?: string;
  currentAction?: string;
  tempData?: Record<string, any>;
  settings?: UserSettings;
}

export interface BotContext extends Context {
  session: SessionData;
}

export interface CommandHandler {
  command: string;
  description: string;
  handler: (ctx: BotContext) => Promise<void>;
}

export interface StepHandler {
  handler: (ctx: BotContext) => Promise<void>;
  next?: string;
}

export interface ConversationState {
  [key: string]: any;
}

export type SettingsOption = "slippage" | "gasPriority";
