import { InlineKeyboard } from "grammy";

/**
 * Create confirmation keyboard with Yes/No buttons
 */
export function createConfirmationKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ Yes", "confirm_yes")
    .text("❌ No", "confirm_no");
}

/**
 * Create gas priority selection keyboard
 */
export function createGasPriorityKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🐢 Low", "gas_low")
    .text("🚶 Medium", "gas_medium")
    .text("🚀 High", "gas_high");
}

/**
 * Create slippage selection keyboard
 */
export function createSlippageKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("0.5%", "slippage_0.5")
    .text("1%", "slippage_1")
    .text("2%", "slippage_2")
    .text("3%", "slippage_3");
}

/**
 * Create settings keyboard
 */
export function createSettingsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🔄 Slippage", "settings_slippage")
    .text("⛽ Gas Priority", "settings_gasPriority")
    .row()
    .text("🔙 Back", "settings_back");
}

/**
 * Create token selection keyboard with common tokens
 */
export function createTokenSelectionKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard()
    .text("USDC", "token_USDC")
    .text("DAI", "token_DAI")
    .row()
    .text("WBTC", "token_WBTC")
    .row()
    .text("Custom Token", "token_custom");

  return keyboard;
}

/**
 * Create pagination keyboard for history view
 */
export function createPaginationKeyboard(
  currentPage: number,
  totalPages: number
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  if (currentPage > 1) {
    keyboard.text("⬅️ Previous", `page_${currentPage - 1}`);
  }

  keyboard.text(`${currentPage}/${totalPages}`, "page_current");

  if (currentPage < totalPages) {
    keyboard.text("➡️ Next", `page_${currentPage + 1}`);
  }

  return keyboard;
}
