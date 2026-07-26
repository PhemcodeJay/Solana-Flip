export class WhatsAppNotifier {
  private phoneNumber: string;
  private isEnabled: boolean;

  constructor() {
    this.phoneNumber = process.env.WHATSAPP_TO || '';
    this.isEnabled = !!this.phoneNumber;
  }

  async sendMessage(message: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`[WhatsApp Disabled] ${message}`);
      return false;
    }

    // WhatsApp notifications can be integrated via:
    // 1. Twilio API (requires account)
    // 2. WhatsApp Business API (requires approval)
    // 3. CallMeBot (free, limited)
    // 4. Console log as fallback
    console.log(`[WhatsApp] To: ${this.phoneNumber} | ${message}`);
    return true;
  }

  async notifyTrade(opening: boolean, pair: string, amount: number, price: number): Promise<boolean> {
    const action = opening ? 'Opening' : 'Closing';
    return this.sendMessage(`${action} trade on ${pair} | ${amount.toFixed(4)} SOL @ $${price.toFixed(4)}`);
  }

  async notifyProfit(profit: number, profitPct: number): Promise<boolean> {
    const emoji = profit >= 0 ? '💰' : '📉';
    return this.sendMessage(`${emoji} Trade: ${profit >= 0 ? '+' : ''}${profit.toFixed(6)} SOL (${profitPct.toFixed(2)}%)`);
  }

  async notifyError(error: string): Promise<boolean> {
    return this.sendMessage(`❌ Error: ${error}`);
  }
}