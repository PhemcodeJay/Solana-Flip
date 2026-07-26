"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PairManager = void 0;
class PairManager {
    constructor() {
        this.activePair = null;
        this.priorityQueue = [];
        this.failedPairs = new Map();
        this.maxRetries = 3;
        this.blacklistDurationMs = 300000;
    }
    addOpportunities(opportunities) {
        for (const opp of opportunities) {
            const score = this.calculateScore(opp);
            const existing = this.priorityQueue.find(p => p.opportunity.pair === opp.pair);
            if (existing) {
                existing.opportunity = opp;
                existing.score = score;
            }
            else {
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
    getNextPair() {
        this.clearExpiredBlacklists();
        for (const pair of this.priorityQueue) {
            if (pair.isActive)
                continue;
            if (this.isBlacklisted(pair.opportunity.pair))
                continue;
            this.activePair = pair;
            pair.isActive = true;
            return pair;
        }
        return null;
    }
    completeCurrentPair(success) {
        if (!this.activePair)
            return;
        if (success) {
            this.priorityQueue = this.priorityQueue.filter(p => p !== this.activePair);
            this.failedPairs.delete(this.activePair.opportunity.pair);
        }
        else {
            this.activePair.attempts++;
            if (this.activePair.attempts >= this.maxRetries) {
                this.blacklistPair(this.activePair.opportunity.pair);
                this.priorityQueue = this.priorityQueue.filter(p => p !== this.activePair);
            }
            else {
                this.activePair.isActive = false;
            }
        }
        this.activePair = null;
    }
    switchToNextPair() {
        if (!this.activePair)
            return null;
        this.activePair.isActive = false;
        this.priorityQueue = this.priorityQueue.filter(p => p !== this.activePair);
        this.activePair = null;
        return this.getNextPair();
    }
    calculateScore(opportunity) {
        const profitScore = opportunity.profitPct;
        const liquidityScore = Math.log10(opportunity.buyPool.liquidity + opportunity.sellPool.liquidity);
        return (profitScore * 0.5) + (liquidityScore * 0.3);
    }
    blacklistPair(pair) {
        this.failedPairs.set(pair, Date.now());
    }
    isBlacklisted(pair) {
        const blacklistTime = this.failedPairs.get(pair);
        if (!blacklistTime)
            return false;
        return Date.now() - blacklistTime < this.blacklistDurationMs;
    }
    clearExpiredBlacklists() {
        const now = Date.now();
        for (const [pair, time] of this.failedPairs) {
            if (now - time >= this.blacklistDurationMs) {
                this.failedPairs.delete(pair);
            }
        }
    }
    getActivePair() {
        return this.activePair;
    }
    getStats() {
        return {
            queueSize: this.priorityQueue.length,
            activePair: this.activePair?.opportunity.pair || null,
        };
    }
}
exports.PairManager = PairManager;
//# sourceMappingURL=priority.js.map