import { Context, SessionFlavor } from "grammy";
import { SessionData } from "./types/commands";

// Custom context type with session data
export type BotContext = Context & SessionFlavor<SessionData>;

// Helper function to create a new session
export function createInitialSessionData(): SessionData {
  return {
    userId: undefined,
    walletAddress: undefined,
    currentAction: undefined,
    tempData: {},
    settings: undefined,
  };
}
