import { ArbOpportunity } from '../dex/interfaces';
export interface PriorityPair {
    opportunity: ArbOpportunity;
    score: number;
    attempts: number;
    lastAttempt: number;
    isActive: boolean;
}
export declare class PairManager {
    private activePair;
    private priorityQueue;
    private failedPairs;
    private maxRetries;
    private blacklistDurationMs;
    addOpportunities(opportunities: ArbOpportunity[]): void;
    getNextPair(): PriorityPair | null;
    completeCurrentPair(success: boolean): void;
    switchToNextPair(): PriorityPair | null;
    private calculateScore;
    private blacklistPair;
    private isBlacklisted;
    private clearExpiredBlacklists;
    getActivePair(): PriorityPair | null;
    getStats(): {
        queueSize: number;
        activePair: string | null;
    };
}
