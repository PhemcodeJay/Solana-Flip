// 3-SOL-optimized arbitrage configuration
function validateEnv() {
  const required = ['PRIVATE_KEY'];
  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nTo get your Phantom Wallet private key:');
    console.error('1. Open Phantom Wallet and unlock your account');
    console.error('2. Click the 3-dot menu → Export Private Key');
    console.error('3. Enter your password and copy the base58 key');
    console.error('4. Paste it in your .env file: PRIVATE_KEY=your_key_here\n');
    process.exit(1);
  }
}

validateEnv();

export const CONFIG = {
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
    privateKey: process.env.PRIVATE_KEY!,
  },
};
