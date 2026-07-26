"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
// 3-SOL-optimized arbitrage configuration
function validateEnv() {
    const required = ['PRIVATE_KEY'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error('\n❌ Missing required environment variables:');
        missing.forEach((key) => console.error(`   - ${key}`));
        console.error('\nPlease create a .env file with your credentials.');
        console.error('See .env.example for required variables.\n');
        process.exit(1);
    }
}
validateEnv();
exports.CONFIG = {
    capital: {
        minStartBalance: 3.0,
        maxPositionSize: 1.2,
        stopLossBalance: 2.8,
    },
    arbitrage: {
        minProfitPct: 0.3,
        maxSlippage: 0.5,
        positionLiquidityRatio: 2.0,
        recheckThreshold: 0.2,
    },
    jito: {
        baseTip: 0.001,
        maxTipPct: 1.5,
        absoluteMaxTip: 0.05,
    },
    execution: {
        maxRetries: 2,
        timeoutMs: 3000,
        cooldownAfterLoss: 10000,
        cooldownAfterWin: 2000,
    },
    scanning: {
        intervalMs: 100,
        cacheTtlMs: 1000,
    },
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || '',
    },
    solana: {
        rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        privateKey: process.env.PRIVATE_KEY,
    },
};
//# sourceMappingURL=settings.js.map