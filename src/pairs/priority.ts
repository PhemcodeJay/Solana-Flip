import { ArbOpportunity } from '../dex/interfaces';
import { CONFIG } from '../config/settings';

export interface PriorityPair {
  opportunity: ArbOpportunity;
  score: number;
  attempts: number;
  lastAttempt: number;
  isActive: boolean;
}

export class PairManager {
  private activePair: PriorityPair | null = null;
  private priorityQueue: PriorityPair[] = [];
  private failedPairs: Map<string, number> = new Map();
  private maxRetries = 3;
  private blacklistDurationMs = 300000;

  addOpportunities(opportunities: ArbOpportunity[]): void {
    for (const opp of opportunities) {
      const score = this.calculateScore(opp);
      const existing = this.priorityQueue.find(p => p.opportunity.pair === opp.pair);

      if (existing) {
        existing.opportunity = opp;
        existing.score = score;
      } else {
        this.priorityQueue.push({
          opportunity: opp,
          score,
          attempts: 0,
          lastAttempt: 0,
          isActive: false,
        });
      }
    }

    this.priorityQueue.sort((a, b) => b.score - a.score);
  }

  getNextPair(): PriorityPair | null {
    this.clearExpiredBlacklists();

    for (const pair of this.priorityQueue) {
      if (pair.isActive) continue;
      if (this.isBlacklisted(pair.opportunity.pair)) continue;

      this.activePair = pair;
      pair.isActive = true;
      return pair;
    }

    return null;
  }

  completeCurrentPair(success: boolean): void {
    if (!this.activePair) return;

    if (success) {
      this.priorityQueue = this.priorityQueue.filter(p => p !== this.activePair);
      this.failedPairs.delete(this.activePair.opportunity.pair);
    } else {
      this.activePair.attempts++;
      if (this.activePair.attempts >= this.maxRetries) {
        this.blacklistPair(this.activePair.opportunity.pair);
        this.priorityQueue = this.priorityQueue.filter(p => p !== this.activePair);
      } else {
        this.activePair.isActive = false;
      }
    }

    this.activePair = null;
  }

  switchToNextPair(): PriorityPair | null {
    if (!this.activePair) return null;

    this.activePair.isActive = false;
    this.priorityQueue = this.priorityQueue.filter(p => p !== this.activePair);
    this.activePair = null;

    return this.getNextPair();
  }

  private calculateScore(opportunity: ArbOpportunity): number {
    const profitScore = opportunity.profitPct;
    const liquidityScore = Math.log10(opportunity.buyPool.liquidity + opportunity.sellPool.liquidity);
    return (profitScore * 0.5) + (liquidityScore * 0.3);
  }

  private blacklistPair(pair: string): void {
    this.failedPairs.set(pair, Date.now());
  }

  private isBlacklisted(pair: string): boolean {
    const blacklistTime = this.failedPairs.get(pair);
    if (!blacklistTime) return false;
    return Date.now() - blacklistTime < this.blacklistDurationMs;
  }

  private clearExpiredBlacklists(): void {
    const now = Date.now();
    for (const [pair, time] of this.failedPairs) {
      if (now - time >= this.blacklistDurationMs) {
        this.failedPairs.delete(pair);
      }
    }
  }

  getActivePair(): PriorityPair | null {
    return this.activePair;
  }

  getStats(): { queueSize: number; activePair: string | null } {
    return {
      queueSize: this.priorityQueue.length,
      activePair: this.activePair?.opportunity.pair || null,
    };
  }
}