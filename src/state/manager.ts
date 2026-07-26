export interface BotState {
  isRunning: boolean;
  startTime: number;
  lastScanTime: number;
  totalScans: number;
  totalTrades: number;
  totalProfit: number;
  currentBalance: number;
  peakBalance: number;
  lastError: string | null;
  status: 'idle' | 'scanning' | 'trading' | 'error' | 'stopped';
}

export class StateManager {
  private state: BotState;

  constructor() {
    this.state = {
      isRunning: false,
      startTime: 0,
      lastScanTime: 0,
      totalScans: 0,
      totalTrades: 0,
      totalProfit: 0,
      currentBalance: 0,
      peakBalance: 0,
      lastError: null,
      status: 'idle',
    };
  }

  getState(): BotState {
    return { ...this.state };
  }

  setRunning(running: boolean): void {
    this.state.isRunning = running;
    this.state.status = running ? 'idle' : 'stopped';
    if (running && this.state.startTime === 0) {
      this.state.startTime = Date.now();
    }
  }

  setScanning(): void {
    this.state.status = 'scanning';
    this.state.lastScanTime = Date.now();
    this.state.totalScans++;
  }

  setTrading(): void {
    this.state.status = 'trading';
  }

  setError(error: string): void {
    this.state.status = 'error';
    this.state.lastError = error;
  }

  setBalance(balance: number): void {
    this.state.currentBalance = balance;
    if (balance > this.state.peakBalance) {
      this.state.peakBalance = balance;
    }
  }

  recordTrade(profit: number): void {
    this.state.totalTrades++;
    this.state.totalProfit += profit;
    this.state.currentBalance += profit;
    if (this.state.currentBalance > this.state.peakBalance) {
      this.state.peakBalance = this.state.currentBalance;
    }
  }

  getUptime(): number {
    if (!this.state.isRunning || this.state.startTime === 0) return 0;
    return Date.now() - this.state.startTime;
  }

  getFormattedUptime(): string {
    const ms = this.getUptime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  getSummary(): string {
    const uptime = this.getFormattedUptime();
    return [
      `=== Bot Status ===`,
      `Status: ${this.state.status}`,
      `Uptime: ${uptime}`,
      `Total Scans: ${this.state.totalScans}`,
      `Total Trades: ${this.state.totalTrades}`,
      `Total Profit: ${this.state.totalProfit.toFixed(6)} SOL`,
      `Current Balance: ${this.state.currentBalance.toFixed(4)} SOL`,
      `Peak Balance: ${this.state.peakBalance.toFixed(4)} SOL`,
      this.state.lastError ? `Last Error: ${this.state.lastError}` : '',
    ].filter(Boolean).join('\n');
  }
}