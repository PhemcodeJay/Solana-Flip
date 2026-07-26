# Solana 3SOL Arbitrage Bot

A high-performance Solana arbitrage bot optimized for trading with ~3 SOL capital across Raydium, Orca, and Meteora DEXes.

## Features

- **3-SOL Optimized**: Position sizing and risk management calibrated for small capital
- **Multi-DEX**: Scans Raydium, Orca, and Meteora for arbitrage opportunities
- **Jito Integration**: Uses Jito bundles for MEV-protected transactions
- **Risk Management**: Stop loss, cooldown periods, and position sizing
- **Telegram Alerts**: Real-time notifications for trades and errors
- **Fast Scanning**: 100ms interval scanning with 1s cache TTL

## Prerequisites

- Node.js 18+
- Solana wallet with at least 3 SOL
- (Optional) Telegram bot for alerts
- (Optional) Jito bundle service account

## Installation

1. Clone the repository:
```bash
git clone <repo-url> cd solana-arb-bot-3sol
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required environment variables:
- `PRIVATE_KEY`: Your wallet private key (base58 encoded)
- `SOLANA_RPC_URL`: Solana RPC endpoint (use your own for production)
- `TELEGRAM_BOT_TOKEN`: (Optional) Telegram bot token
- `TELEGRAM_CHAT_ID`: (Optional) Telegram chat ID

4. Build the project:
```bash
npm run build
```

## Usage

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

## Configuration

Edit `src/config/settings.ts` to adjust bot parameters:

### Capital Management
- `minStartBalance`: Minimum SOL required to start (3.0 SOL)
- `maxPositionSize`: Maximum position size per trade (1.2 SOL)
- `stopLossBalance`: Stop trading if balance drops below (2.8 SOL)

### Arbitrage Parameters
- `minProfitPct`: Minimum profit percentage to execute (0.3%)
- `maxSlippage`: Maximum allowed slippage (0.5%)
- `recheckThreshold`: Recheck opportunity if price moves (0.2%)

### Jito Bundles
- `baseTip`: Base tip amount in SOL (0.001 SOL)
- `maxTipPct`: Maximum tip as percentage of profit (1.5%)
- `absoluteMaxTip`: Hard cap on tip amount (0.05 SOL)

### Execution
- `maxRetries`: Maximum retries on failed transactions (2)
- `timeoutMs`: Transaction timeout in milliseconds (3000)
- `cooldownAfterLoss`: Cooldown after a loss (10s)
- `cooldownAfterWin`: Cooldown after a win (2s)

### Scanning
- `intervalMs`: Scan interval in milliseconds (100)
- `cacheTtlMs`: Cache time-to-live in milliseconds (1000)

## Architecture

```
src/
├── index.ts              # Entry point
├── bot.ts                # Main bot orchestration
├── config/
│   └── settings.ts       # Configuration parameters
├── solana/
│   └── wallet.ts         # Wallet management
├── arbitrage/
│   └── calculator.ts     # Profit calculation
├── dex/
│   └── interfaces.ts     # DEX interfaces and types
├── pairs/
│   └── priority.ts       # Pair prioritization
├── risk/                 # Risk management modules
├── jito/                 # Jito bundle integration
├── state/                # State management
└── alerts/               # Telegram alerts
```

## Risk Disclaimer

Trading cryptocurrencies carries significant risk. This bot is provided as-is for educational purposes. Always test with small amounts first. The authors are not responsible for any financial losses.

## License

MIT