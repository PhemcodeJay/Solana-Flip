import { CONFIG } from '../config/settings';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface AlertMessage {
  type: AlertType;
  title: string;
  message: string;
  timestamp: number;
}

export class TelegramAlert {
  private botToken: string;
  private chatId: string;
  private isEnabled: boolean;

  constructor() {
    this.botToken = CONFIG.telegram.botToken;
    this.chatId = CONFIG.telegram.chatId;
    this.isEnabled = !!(this.botToken && this.chatId);
  }

  async sendMessage(message: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`[Telegram Disabled] ${message}`);
      return false;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.chatId,
            text: message,
            parse_mode: 'HTML',
          }),
        }
      );

      if (!response.ok) {
        console.warn(`Telegram send failed: ${response.statusText}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Telegram error:', error);
      return false;
    }
  }

  async sendAlert(alert: AlertMessage): Promise<boolean> {
    const emojiMap: Record<AlertType, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    const emoji = emojiMap[alert.type];
    const formattedMessage = `${emoji} <b>${alert.title}</b>\n\n${alert.message}`;
    
    return this.sendMessage(formattedMessage);
  }

  async notifyTrade(opening: boolean, pair: string, amount: number, price: number): Promise<boolean> {
    const action = opening ? '🟢 Opening' : '🔴 Closing';
    const message = `${action} trade on ${pair}\nAmount: ${amount.toFixed(4)} SOL\nPrice: $${price.toFixed(4)}`;
    
    return this.sendMessage(message);
  }

  async notifyProfit(profit: number, profitPct: number): Promise<boolean> {
    const emoji = profit >= 0 ? '💰' : '📉';
    const message = `${emoji} Trade completed\nProfit: ${profit >= 0 ? '+' : ''}${profit.toFixed(6)} SOL (${profitPct.toFixed(2)}%)`;
    
    return this.sendMessage(message);
  }

  async notifyError(error: string): Promise<boolean> {
    return this.sendAlert({
      type: 'error',
      title: 'Bot Error',
      message: error,
      timestamp: Date.now(),
    });
  }
}