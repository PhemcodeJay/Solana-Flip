import { CONFIG } from '../config/settings';
import { ArbOpportunity } from '../dex/interfaces';

export interface ProfitCalculation {
  grossProfit: number;
  fees: number;
  slippageCost: number;
  netProfit: number;
  netProfitPct: number;
  isProfitable: boolean;
}

export class ArbitrageCalculator {
  calculateNetProfitOpportunity(opportunity: ArbOpportunity, positionSize: number): ProfitCalculation {
    // Use actual pool fees instead of hardcoded values
    const buyFee = positionSize * (opportunity.buyPool.fee || 0.003);
    const sellFee = positionSize * (opportunity.sellPool.fee || 0.003);
    const totalFees = buyFee + sellFee;

    // Slippage estimate based on pool liquidity
    const totalLiquidity = opportunity.buyPool.liquidity + opportunity.sellPool.liquidity;
    const slippageRatio = totalLiquidity > 0 ? positionSize / totalLiquidity : 0.1;
    const slippageCost = positionSize * Math.min(slippageRatio * 2, CONFIG.arbitrage.maxSlippage / 100);

    // GROSS PROFIT: price difference * position size
    const grossProfit = positionSize * (opportunity.profitPct / 100);

    // Net profit
    const netProfit = grossProfit - totalFees - slippageCost;
    const netProfitPct = positionSize > 0 ? (netProfit / positionSize) * 100 : 0;

    return {
      grossProfit,
      fees: totalFees,
      slippageCost,
      netProfit,
      netProfitPct,
      isProfitable: netProfit > 0.01 && netProfitPct > CONFIG.arbitrage.minProfitPct // At least min profit after fees
    };
  }

  calculateOptimalPositionSize(balance: number): number {
    return Math.min(balance * 0.4, CONFIG.capital.maxPositionSize);
  }

  calculatePositionSizeWithLiquidity(balance: number, poolLiquidity: number): number {
    const maxByBalance = this.calculateOptimalPositionSize(balance);
    const maxByLiquidity = poolLiquidity * 0.05; // Max 5% of pool liquidity
    return Math.min(maxByBalance, maxByLiquidity);
  }
}