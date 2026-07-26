"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const wallet_1 = require("./solana/wallet");
const settings_1 = require("./config/settings");
const calculator_1 = require("./arbitrage/calculator");
class Bot {
    constructor() {
        this.isRunning = false;
        this.wallet = new wallet_1.Wallet();
        this.calculator = new calculator_1.ArbitrageCalculator();
    }
    async start() {
        try {
            console.log('Starting Solana 3SOL arbitrage bot...');
            // Check wallet balance
            const balance = await this.wallet.getBalance();
            console.log(`Wallet balance: ${balance} SOL`);
            if (balance < settings_1.CONFIG.capital.minStartBalance) {
                console.error(`\n❌ Insufficient balance: ${balance} SOL`);
                console.error(`   Minimum required: ${settings_1.CONFIG.capital.minStartBalance} SOL`);
                console.error(`   Please fund your wallet and try again.\n`);
                await this.stop();
                process.exit(1);
            }
            console.log(`Minimum start balance met: ${settings_1.CONFIG.capital.minStartBalance} SOL`);
            console.log('Bot started successfully');
            this.isRunning = true;
            // Start arbitrage scanning loop
            await this.scanLoop();
        }
        catch (error) {
            console.error('Failed to start bot:', error);
            throw error;
        }
    }
    async scanLoop() {
        while (this.isRunning) {
            try {
                const balance = await this.wallet.getBalance();
                // Check stop loss before scanning
                if (balance <= settings_1.CONFIG.capital.stopLossBalance) {
                    console.warn(`Stop loss triggered: balance ${balance} <= ${settings_1.CONFIG.capital.stopLossBalance}`);
                    await this.stop();
                    break;
                }
                // Calculate optimal position size
                const positionSize = this.calculator.calculateOptimalPositionSize(balance);
                console.log(`Optimal position size: ${positionSize} SOL`);
                // TODO: Implement arbitrage opportunity scanning
                // TODO: Execute trades when opportunities are found
                // Wait before next scan
                await this.delay(settings_1.CONFIG.scanning.intervalMs);
            }
            catch (error) {
                console.error('Error in scan loop:', error);
                await this.delay(5000); // Wait longer on error
            }
        }
    }
    async stop() {
        console.log('Stopping bot...');
        this.isRunning = false;
        console.log('Bot stopped');
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map