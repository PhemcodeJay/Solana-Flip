export class DiscordNotifier {
  private webhookUrl: string;
  private isEnabled: boolean;

  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
    this.isEnabled = !!this.webhookUrl;
  }

  async sendMessage(message: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log(`[Discord Disabled] ${message}`);
      return false;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
          allowed_mentions: { parse: [] },
        }),
      });

      if (!response.ok) {
        console.warn(`Discord webhook failed: ${response.statusText}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Discord error:', error);
      return false;
    }
  }

  async sendEmbed(title: string, description: string, color: number = 0x00ff00): Promise<boolean> {
    if (!this.isEnabled) return false;

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title,
            description,
            color,
            timestamp: new Date().toISOString(),
          }],
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async notifyTrade(opening: boolean, pair: string, amount: number, price: number): Promise<boolean> {
    const action = opening ? '🟢 **Opening Position**' : '🔴 **Closing Position**';
    const color = opening ? 0x00ff00 : 0xff0000;
    return this.sendEmbed(
      action,
      `**Pair:** ${pair}\n**Amount:** ${amount.toFixed(4)} SOL\n**Price:** $${price.toFixed(4)}`,
      color
    );
  }

  async notifyProfit(profit: number, profitPct: number): Promise<boolean> {
    const emoji = profit >= 0 ? '💰' : '📉';
    const color = profit >= 0 ? 0x00ff00 : 0xff0000;
    return this.sendEmbed(
      `${emoji} Trade Completed`,
      `**Profit:** ${profit >= 0 ? '+' : ''}${profit.toFixed(6)} SOL (${profitPct.toFixed(2)}%)`,
      color
    );
  }

  async notifyError(error: string): Promise<boolean> {
    return this.sendEmbed('❌ Bot Error', error, 0xff0000);
  }
}