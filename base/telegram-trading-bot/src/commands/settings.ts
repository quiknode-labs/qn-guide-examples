import { BotContext } from "../context";
import { getUserSettings, saveUserSettings } from "../lib/database";
import { CommandHandler } from "../types/commands";
import {
  createSettingsKeyboard,
  createSlippageKeyboard,
  createGasPriorityKeyboard,
} from "../utils/keyboardHelper";
import { UserSettings } from "../types/config";
import { SettingsOption } from "../types/commands";
import { isValidGasPriority, isValidSlippage } from "../utils/validators";
import { getGasPriorityLabel } from "../lib/swap";

const settingsHandler: CommandHandler = {
  command: "settings",
  description: "Change slippage or gas priority,",
  handler: async (ctx: BotContext) => {
    try {
      const userId = ctx.session.userId;

      if (!userId) {
        await ctx.reply("❌ Please start the bot first with /start command.");
        return;
      }

      // Get user settings
      let settings = ctx.session.settings;

      if (!settings) {
        settings = getUserSettings(userId) || undefined;

        if (settings) {
          ctx.session.settings = settings;
        } else {
          // Create default settings
          settings = {
            userId,
            slippage: 1.0,
            gasPriority: "medium",
          };

          saveUserSettings(userId, {
            slippage: settings.slippage,
            gasPriority: settings.gasPriority,
          });

          ctx.session.settings = settings;
        }
      }

      await displaySettings(ctx, settings);
    } catch (error) {
      console.error("Error in settings command:", error);
      await ctx.reply("❌ An error occurred. Please try again later.");
    }
  },
};

// Display current settings
async function displaySettings(
  ctx: BotContext,
  settings: UserSettings
): Promise<void> {
  try {
    await ctx.reply(
      `⚙️ *Your Settings*\n\n` +
        `*Slippage Tolerance*: ${settings.slippage}%\n` +
        `*Gas Priority*: ${getGasPriorityLabel(settings.gasPriority)}\n` +
        `Select an option to modify:`,
      {
        parse_mode: "Markdown",
        reply_markup: createSettingsKeyboard(),
      }
    );
  } catch (error) {
    console.error("Error displaying settings:", error);
    await ctx.reply("❌ An error occurred. Please try again later.");
  }
}

// Handle settings option selection
export async function handleSettingsOption(
  ctx: BotContext,
  option: SettingsOption
): Promise<void> {
  try {
    const userId = ctx.session.userId;

    if (!userId) {
      await ctx.answerCallbackQuery(
        "Session expired. Please use /start to begin again."
      );
      return;
    }

    // Set current action
    ctx.session.currentAction = `settings_${option}`;

    switch (option) {
      case "slippage":
        await ctx.editMessageText(
          `🔄 *Slippage Tolerance Setting*\n\n` +
            `Slippage tolerance is the maximum price difference you're willing to accept for a trade.\n\n` +
            `Current setting: ${ctx.session.settings?.slippage}%\n\n` +
            `Select a new slippage tolerance:`,
          {
            parse_mode: "Markdown",
            reply_markup: createSlippageKeyboard(),
          }
        );
        break;

      case "gasPriority":
        await ctx.editMessageText(
          `⛽ *Gas Priority Setting*\n\n` +
            `Gas priority determines how quickly your transactions are likely to be processed.\n\n` +
            `Current setting: ${getGasPriorityLabel(
              ctx.session.settings?.gasPriority || "medium"
            )}\n\n` +
            `Select a new gas priority:`,
          {
            parse_mode: "Markdown",
            reply_markup: createGasPriorityKeyboard(),
          }
        );
        break;

      default:
        await ctx.answerCallbackQuery("Unknown setting option");
        break;
    }
  } catch (error) {
    console.error("Error handling settings option:", error);
    await ctx.answerCallbackQuery("An error occurred. Please try again.");
  }
}

// Update slippage setting
export async function updateSlippage(
  ctx: BotContext,
  value: number
): Promise<void> {
  try {
    const userId = ctx.session.userId;

    if (!userId) {
      await ctx.answerCallbackQuery("Session expired");
      return;
    }

    if (!isValidSlippage(value)) {
      await ctx.answerCallbackQuery("Invalid slippage value");
      return;
    }

    // Update settings
    const settings = ctx.session.settings || {
      userId,
      slippage: 1.0,
      gasPriority: "medium",
    };

    settings.slippage = value;
    ctx.session.settings = settings;

    // Save to database
    saveUserSettings(userId, {
      slippage: settings.slippage,
      gasPriority: settings.gasPriority,
    });

    await ctx.answerCallbackQuery(`Slippage set to ${value}%`);

    // Reset current action
    ctx.session.currentAction = undefined;

    // Show updated settings
    await displaySettings(ctx, settings);
  } catch (error) {
    console.error("Error updating slippage:", error);
    await ctx.answerCallbackQuery("An error occurred");
  }
}

// Update gas priority setting
export async function updateGasPriority(
  ctx: BotContext,
  priority: "low" | "medium" | "high"
): Promise<void> {
  try {
    const userId = ctx.session.userId;

    if (!userId) {
      await ctx.answerCallbackQuery("Session expired");
      return;
    }

    if (!isValidGasPriority(priority)) {
      await ctx.answerCallbackQuery("Invalid gas priority");
      return;
    }

    // Update settings
    const settings = ctx.session.settings || {
      userId,
      slippage: 1.0,
      gasPriority: "medium",
    };

    settings.gasPriority = priority;
    ctx.session.settings = settings;

    // Save to database
    saveUserSettings(userId, {
      slippage: settings.slippage,
      gasPriority: settings.gasPriority,
    });

    await ctx.answerCallbackQuery(`Gas priority set to ${priority}`);

    // Reset current action
    ctx.session.currentAction = undefined;

    // Show updated settings
    await displaySettings(ctx, settings);
  } catch (error) {
    console.error("Error updating gas priority:", error);
    await ctx.answerCallbackQuery("An error occurred");
  }
}

export default settingsHandler;
