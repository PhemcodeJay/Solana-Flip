# Solana 3SOL Arbitrage Bot

A high-performance Solana arbitrage bot optimized for trading with ~3 SOL capital across Raydium, Orca, and Meteora DEXes.

## Features

- **3-SOL Optimized**: Position sizing and risk management calibrated for small capital
- **Multi-DEX**: Scans Raydium, Orca, and Meteora for arbitrage opportunities
- **Jito Integration**: Uses Jito bundles for MEV-protected transactions
- **Risk Management**: Stop loss, cooldown periods, position sizing, drawdown protection
- **Telegram Alerts**: Real-time notifications for trades, profits, and errors
- **Discord Webhooks**: Rich embedded notifications for trade events
- **WhatsApp Fallback**: Console-based notification system
- **Phantom Wallet Compatible**: Uses Solana web3.js for wallet operations
- **State Tracking**: Full bot state, uptime, trade history, and performance metrics
- **Fast Scanning**: 100ms interval scanning with 1s cache TTL
- **Pair Prioritization**: Smart scoring and blacklisting of failed pairs

## Prerequisites

- Node.js 18+
- Phantom Wallet (Solana)
- Solana wallet with at least 3 SOL
- (Optional) Telegram bot for alerts
- (Optional) Discord webhook for alerts

## Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd solana-arb-bot-3sol
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
- `PRIVATE_KEY`: Your wallet private key (base58 encoded from Phantom Wallet)
- `SOLANA_RPC_URL`: Solana RPC endpoint (use your own for production)
- `TELEGRAM_BOT_TOKEN`: (Optional) Telegram bot token
- `TELEGRAM_CHAT_ID`: (Optional) Telegram chat ID
- `DISCORD_WEBHOOK_URL`: (Optional) Discord webhook URL
- `WHATSAPP_TO`: (Optional) WhatsApp phone number

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
├── bot.ts                # Main bot orchestration (scan loop, trade execution)
├── config/
│   └── settings.ts       # Configuration parameters & env validation
├── solana/
│   └── wallet.ts         # Wallet management (balance, keypair, connection)
├── arbitrage/
│   └── calculator.ts     # Profit calculation with dynamic fees & slippage
├── dex/
│   ├── interfaces.ts     # DEX types, Pool & ArbOpportunity interfaces
│   ├── raydium.ts        # Raydium DEX adapter (API + fallback pools)
│   ├── orca.ts           # Orca DEX adapter (API + fallback pools)
│   ├── meteora.ts        # Meteora DEX adapter (API + fallback pools)
│   └── scanner.ts        # Cross-DEX arbitrage opportunity scanner
├── pairs/
│   └── priority.ts       # Pair prioritization, scoring & blacklisting
├── jito/
│   └── jito.ts           # Jito bundle submission & tip management
├── alerts/
│   ├── telegram.ts       # Telegram alert integration
│   ├── discord.ts        # Discord webhook integration
│   └── whatsapp.ts       # WhatsApp notification integration
├── risk/
│   └── manager.ts        # Risk management (drawdown, daily loss, position sizing)
└── state/
    └── manager.ts        # Bot state tracking (uptime, trades, balance)
```

## How It Works

1. **Startup**: Validates environment, checks wallet balance (min 3 SOL)
2. **Scan Loop**: Every 100ms, fetches pools from Raydium, Orca, and Meteora
3. **Opportunity Detection**: Compares prices across DEXes for the same token pairs
4. **Risk Check**: Validates stop loss, drawdown, daily loss limits, consecutive losses
5. **Trade Execution**: Calculates position size, fees, slippage, and net profit
6. **Jito Bundle**: Sends arbitrage transactions as a bundle for MEV protection
7. **Recording**: Trades are recorded for performance metrics and risk calculations
8. **Notifications**: Sends alerts to Telegram, Discord, and WhatsApp simultaneously

## Notifications

The bot supports multiple notification channels that fire simultaneously:
- **Telegram**: HTML-formatted messages via Telegram Bot API
- **Discord**: Rich embedded messages via webhooks
- **WhatsApp**: Console-based notifications (ready for Twilio/WhatsApp Business API integration)

## Getting Phantom Wallet Private Key

1. Open Phantom Wallet and unlock your account
2. Click the 3-dot menu → Export Private Key
3. Enter your password
4. Copy the base58 encoded private key
5. Paste it in your `.env` file

## Risk Disclaimer

Trading cryptocurrencies carries significant risk. This bot is provided as-is for educational purposes. Always test with small amounts first. The authors are not responsible for any financial losses.

## License

MIT