"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArbitrageCalculator = void 0;
const settings_1 = require("../config/settings");
class ArbitrageCalculator {
    calculateNetProfitOpportunity(opportunity, positionSize) {
        // Fees: typically 0.25-0.3% per swap
        const buyFee = positionSize * 0.003;
        const sellFee = positionSize * 0.003;
        const totalFees = buyFee + sellFee;
        // Slippage estimate based on pool liquidity
        const slippageCost = positionSize * 0.005; // 0.5%
        // GROSS PROFIT: price difference * position size
        const grossProfit = positionSize * (opportunity.profitPct / 100);
        // Net profit
        const netProfit = grossProfit - totalFees - slippageCost;
        const netProfitPct = (netProfit / positionSize) * 100;
        return {
            grossProfit,
            fees: totalFees,
            slippageCost,
            netProfit,
            netProfitPct,
            isProfitable: netProfit > 0.01 // At least $0.01 profit after fees
        };
    }
    calculateOptimalPositionSize(balance) {
        return Math.min(balance * 0.4, settings_1.CONFIG.capital.maxPositionSize);
    }
}
exports.ArbitrageCalculator = ArbitrageCalculator;
//# sourceMappingURL=calculator.js.map