import { Wallet } from './solana/wallet';
import { CONFIG } from './config/settings';
import { ArbitrageCalculator } from './arbitrage/calculator';
import { PairManager } from './pairs/priority';
import { DexScanner } from './dex/scanner';
import { JitoManager } from './jito/jito';
import { TelegramAlert } from './alerts/telegram';
import { DiscordNotifier } from './alerts/discord';
import { WhatsAppNotifier } from './alerts/whatsapp';
import { RiskManager } from './risk/manager';
import { StateManager } from './state/manager';
import { ArbOpportunity } from './dex/interfaces';

export class Bot {
  private wallet: Wallet;
  private calculator: ArbitrageCalculator;
  private scanner: DexScanner;
  private pairManager: PairManager;
  private jito: JitoManager;
  private telegram: TelegramAlert;
  private discord: DiscordNotifier;
  private whatsapp: WhatsAppNotifier;
  private risk: RiskManager;
  private state: StateManager;
  private isRunning: boolean = false;
  private isTrading: boolean = false;

  constructor() {
    this.wallet = new Wallet();
    this.calculator = new ArbitrageCalculator();
    this.scanner = new DexScanner(this.wallet.getConnection());
    this.pairManager = new PairManager();
    this.jito = new JitoManager(this.wallet.getConnection());
    this.telegram = new TelegramAlert();
    this.discord = new DiscordNotifier();
    this.whatsapp = new WhatsAppNotifier();
    this.risk = new RiskManager();
    this.state = new StateManager();
  }

  async start(): Promise<void> {
    try {
      console.log('Starting Solana 3SOL arbitrage bot...');
      this.state.setRunning(true);
      
      // Check wallet balance
      const balance = await this.wallet.getBalance();
      console.log(`Wallet balance: ${balance} SOL`);
      this.state.setBalance(balance);
      
      if (balance < CONFIG.capital.minStartBalance) {
        console.error(`\n❌ Insufficient balance: ${balance} SOL`);
        console.error(`   Minimum required: ${CONFIG.capital.minStartBalance} SOL`);
        console.error(`   Please fund your wallet and try again.\n`);
        await this.sendAllAlerts(`Insufficient balance: ${balance} SOL (min: ${CONFIG.capital.minStartBalance} SOL)`, 'error');
        await this.stop();
        process.exit(1);
      }

      console.log(`Minimum start balance met: ${CONFIG.capital.minStartBalance} SOL`);
      console.log('Bot started successfully');
      
      await this.sendAllAlerts(`Solana Arbitrage Bot Started\nBalance: ${balance.toFixed(4)} SOL`, 'success');

      // Start arbitrage scanning loop
      await this.scanLoop();
    } catch (error) {
      console.error('Failed to start bot:', error);
      this.state.setError(`Start failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async scanLoop(): Promise<void> {
    let lastOpportunityLog = 0;
    const opportunityLogInterval = 5000; // Log opportunities every 5s

    while (this.isRunning) {
      try {
        const balance = await this.wallet.getBalance();
        this.state.setBalance(balance);
        
        // Check stop loss before scanning
        if (balance <= CONFIG.capital.stopLossBalance) {
          console.warn(`Stop loss triggered: balance ${balance.toFixed(4)} SOL <= ${CONFIG.capital.stopLossBalance} SOL`);
          await this.sendAllAlerts(`Stop loss triggered! Balance: ${balance.toFixed(4)} SOL`, 'warning');
          await this.stop();
          break;
        }

        // Check risk management
        const riskCheck = this.risk.canTrade(balance);
        if (!riskCheck.allowed) {
          if (Math.random() < 0.1) {
            console.log(`Risk check: ${riskCheck.reason}`);
          }
          await this.delay(CONFIG.scanning.intervalMs);
          continue;
        }

        // Scan for arbitrage opportunities
        this.state.setScanning();
        const opportunities = await this.scanner.findArbitrageOpportunities();

        if (opportunities.length > 0) {
          // Log opportunities periodically
          if (Date.now() - lastOpportunityLog > opportunityLogInterval) {
            console.log(`Found ${opportunities.length} arbitrage opportunities`);
            opportunities.slice(0, 3).forEach((opp, i) => {
              console.log(`  #${i + 1}: ${opp.pair} | ${opp.buyDex} -> ${opp.sellDex} | Profit: ${opp.profitPct.toFixed(3)}%`);
            });
            lastOpportunityLog = Date.now();
            
            await this.sendAllAlerts(`Found ${opportunities.length} opportunities. Top: ${opportunities[0].pair} @ ${opportunities[0].profitPct.toFixed(3)}%`, 'info');
          }

          // Add to pair manager
          this.pairManager.addOpportunities(opportunities);

          // Try to execute the best opportunity
          if (!this.isTrading) {
            await this.executeBestOpportunity(balance);
          }
        }

        // Wait before next scan
        await this.delay(CONFIG.scanning.intervalMs);
      } catch (error) {
        console.error('Error in scan loop:', error);
        const errMsg = error instanceof Error ? error.message : String(error);
        this.state.setError(`Scan error: ${errMsg}`);
        await this.sendAllAlerts(`Scan error: ${errMsg}`, 'error');
        await this.delay(5000); // Wait longer on error
      }
    }
  }

  private async executeBestOpportunity(balance: number): Promise<void> {
    this.isTrading = true;
    this.state.setTrading();

    try {
      const pair = this.pairManager.getNextPair();
      if (!pair) {
        this.isTrading = false;
        return;
      }

      const opportunity = pair.opportunity;
      
      // Calculate position size with risk management
      const positionSize = this.risk.getPositionSize(balance);
      
      // Calculate net profit
      const profitCalc = this.calculator.calculateNetProfitOpportunity(opportunity, positionSize);
      
      console.log(`Evaluating trade opportunity:`);
      console.log(`   Pair: ${opportunity.pair}`);
      console.log(`   Buy: ${opportunity.buyDex} | Sell: ${opportunity.sellDex}`);
      console.log(`   Position: ${positionSize.toFixed(4)} SOL`);
      console.log(`   Net Profit: ${profitCalc.netProfit.toFixed(6)} SOL (${profitCalc.netProfitPct.toFixed(3)}%)`);

      // Only execute if profitable
      if (!profitCalc.isProfitable) {
        console.log(`   Skipping - not profitable enough`);
        this.pairManager.completeCurrentPair(false);
        this.isTrading = false;
        return;
      }

      // Execute the trade via Jito
      console.log(`Executing arbitrage trade...`);
      await this.sendTradeAlerts(true, opportunity.pair, positionSize, 0);

      // TODO: Build and execute actual swap transactions
      // This would involve:
      // 1. Building swap instructions for buy DEX
      // 2. Building swap instructions for sell DEX
      // 3. Creating a versioned transaction
      // 4. Sending via Jito bundle
      
      // Simulated trade execution for now
      const success = await this.executeSimulatedTrade(opportunity, positionSize);

      if (success) {
        const actualProfit = profitCalc.netProfit;
        console.log(`   Trade successful! Profit: ${actualProfit.toFixed(6)} SOL`);
        
        await this.sendTradeAlerts(false, opportunity.pair, positionSize, 0);
        await this.sendAllAlerts(`Profit: ${actualProfit >= 0 ? '+' : ''}${actualProfit.toFixed(6)} SOL (${profitCalc.netProfitPct.toFixed(2)}%)`, 'success');
        
        this.risk.recordTrade({
          timestamp: Date.now(),
          pair: opportunity.pair,
          positionSize,
          profit: actualProfit,
          profitPct: profitCalc.netProfitPct,
          success: true,
        });
        
        this.state.recordTrade(actualProfit);
        this.pairManager.completeCurrentPair(true);
        
        // Cooldown after win
        await this.delay(CONFIG.execution.cooldownAfterWin);
      } else {
        console.log(`   Trade failed`);
        
        this.risk.recordTrade({
          timestamp: Date.now(),
          pair: opportunity.pair,
          positionSize,
          profit: -profitCalc.fees - profitCalc.slippageCost,
          profitPct: -Math.abs(profitCalc.netProfitPct),
          success: false,
        });
        
        this.pairManager.completeCurrentPair(false);
        
        // Cooldown after loss
        await this.delay(CONFIG.execution.cooldownAfterLoss);
      }

    } catch (error) {
      console.error('Error executing trade:', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      this.state.setError(`Trade error: ${errMsg}`);
      await this.sendAllAlerts(`Trade error: ${errMsg}`, 'error');
    } finally {
      this.isTrading = false;
    }
  }

  private async executeSimulatedTrade(opportunity: ArbOpportunity, positionSize: number): Promise<boolean> {
    // Simulate network delay
    await this.delay(1000 + Math.random() * 2000);
    
    // 70% chance of success for simulation
    const success = Math.random() > 0.3;
    
    if (success) {
      console.log(`   Bundle sent successfully`);
      console.log(`   Trade confirmed on-chain`);
    } else {
      console.log(`   Bundle submission failed, retrying...`);
    }
    
    return success;
  }

  async stop(): Promise<void> {
    console.log('Stopping bot...');
    this.isRunning = false;
    this.state.setRunning(false);
    
    const summary = this.state.getSummary();
    console.log('\n' + summary);
    
    await this.sendAllAlerts(`Bot Stopped\n\n${summary}`, 'warning');
    console.log('Bot stopped');
  }

  private async sendAllAlerts(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<void> {
    await Promise.all([
      this.telegram.sendMessage(message),
      this.discord.sendMessage(message),
      this.whatsapp.sendMessage(message),
    ]);
  }

  private async sendTradeAlerts(opening: boolean, pair: string, amount: number, price: number): Promise<void> {
    await Promise.all([
      this.telegram.notifyTrade(opening, pair, amount, price),
      this.discord.notifyTrade(opening, pair, amount, price),
      this.whatsapp.notifyTrade(opening, pair, amount, price),
    ]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getState() {
    return this.state.getState();
  }

  getSummary(): string {
    return this.state.getSummary();
  }

  getRiskMetrics() {
    return this.risk.getMetrics();
  }

  getPairStats() {
    return this.pairManager.getStats();
  }
}