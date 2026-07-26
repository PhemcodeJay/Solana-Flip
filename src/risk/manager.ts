import { CONFIG } from '../config/settings';

export interface TradeRecord {
  timestamp: number;
  pair: string;
  positionSize: number;
  profit: number;
  profitPct: number;
  success: boolean;
}

export interface RiskMetrics {
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalProfit: number;
  totalLoss: number;
  winRate: number;
  currentDrawdown: number;
  isInDrawdown: boolean;
}

export class RiskManager {
  private tradeHistory: TradeRecord[] = [];
  private consecutiveLosses: number = 0;
  private maxConsecutiveLosses: number = 3;
  private maxDailyLoss: number = 0.5; // 0.5 SOL max daily loss
  private dailyLoss: number = 0;
  private lastDayReset: number = Date.now();
  private peakBalance: number = 0;
  private currentBalance: number = 0;

  constructor() {
    this.resetDailyLoss();
  }

  canTrade(balance: number): { allowed: boolean; reason?: string } {
    this.checkDayReset();

    // Check stop loss
    if (balance <= CONFIG.capital.stopLossBalance) {
      return { allowed: false, reason: 'Stop loss triggered' };
    }

    // Check consecutive losses
    if (this.consecutiveLosses >= this.maxConsecutiveLosses) {
      return { allowed: false, reason: 'Max consecutive losses reached' };
    }

    // Check daily loss limit
    if (this.dailyLoss >= this.maxDailyLoss) {
      return { allowed: false, reason: 'Daily loss limit reached' };
    }

    // Check drawdown
    if (this.currentBalance > 0) {
      const drawdownPct = ((this.peakBalance - this.currentBalance) / this.peakBalance) * 100;
      if (drawdownPct > 10) {
        return { allowed: false, reason: `Drawdown too high: ${drawdownPct.toFixed(1)}%` };
      }
    }

    return { allowed: true };
  }

  recordTrade(trade: TradeRecord): void {
    this.tradeHistory.push(trade);
    this.currentBalance = trade.positionSize + trade.profit;

    if (trade.profit > 0) {
      this.consecutiveLosses = 0;
      if (this.currentBalance > this.peakBalance) {
        this.peakBalance = this.currentBalance;
      }
    } else {
      this.consecutiveLosses++;
      this.dailyLoss += Math.abs(trade.profit);
    }
  }

  getMetrics(): RiskMetrics {
    const successfulTrades = this.tradeHistory.filter(t => t.profit > 0).length;
    const failedTrades = this.tradeHistory.filter(t => t.profit <= 0).length;
    const totalProfit = this.tradeHistory
      .filter(t => t.profit > 0)
      .reduce((sum, t) => sum + t.profit, 0);
    const totalLoss = this.tradeHistory
      .filter(t => t.profit < 0)
      .reduce((sum, t) => sum + Math.abs(t.profit), 0);

    return {
      totalTrades: this.tradeHistory.length,
      successfulTrades,
      failedTrades,
      totalProfit,
      totalLoss,
      winRate: this.tradeHistory.length > 0 
        ? (successfulTrades / this.tradeHistory.length) * 100 
        : 0,
      currentDrawdown: this.peakBalance > 0 
        ? ((this.peakBalance - this.currentBalance) / this.peakBalance) * 100 
        : 0,
      isInDrawdown: this.currentBalance < this.peakBalance,
    };
  }

  getPositionSize(balance: number): number {
    const baseSize = Math.min(balance * 0.4, CONFIG.capital.maxPositionSize);
    
    // Reduce position size on consecutive losses
    if (this.consecutiveLosses > 0) {
      const reductionFactor = Math.max(0.5, 1 - (this.consecutiveLosses * 0.2));
      return baseSize * reductionFactor;
    }

    return baseSize;
  }

  private checkDayReset(): void {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    if (now - this.lastDayReset >= dayMs) {
      this.resetDailyLoss();
    }
  }

  private resetDailyLoss(): void {
    this.dailyLoss = 0;
    this.lastDayReset = Date.now();
  }

  getTradeHistory(): TradeRecord[] {
    return [...this.tradeHistory];
  }

  getRecentTrades(count: number = 10): TradeRecord[] {
    return this.tradeHistory.slice(-count);
  }
}