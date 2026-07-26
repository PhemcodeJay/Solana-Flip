import { ArbOpportunity } from '../dex/interfaces';
export interface ProfitCalculation {
    grossProfit: number;
    fees: number;
    slippageCost: number;
    netProfit: number;
    netProfitPct: number;
    isProfitable: boolean;
}
export declare class ArbitrageCalculator {
    calculateNetProfitOpportunity(opportunity: ArbOpportunity, positionSize: number): ProfitCalculation;
    calculateOptimalPositionSize(balance: number): number;
}
