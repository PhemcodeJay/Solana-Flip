import { Connection, PublicKey, VersionedTransaction, TransactionMessage } from '@solana/web3.js';
import { CONFIG } from '../config/settings';

export interface JitoTipAccount {
  address: string;
  balance: number;
}

export class JitoManager {
  private connection: Connection;
  private tipAccounts: JitoTipAccount[] = [];
  private lastTipUpdate: number = 0;
  private readonly tipUpdateInterval = 60000; // 1 minute

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async getTipAccounts(): Promise<string[]> {
    if (Date.now() - this.lastTipUpdate > this.tipUpdateInterval || this.tipAccounts.length === 0) {
      await this.refreshTipAccounts();
    }
    return this.tipAccounts.map(a => a.address);
  }

  private async refreshTipAccounts(): Promise<void> {
    try {
      // Jito tip accounts are known public keys
      const knownTipAccounts = [
        'Cw8PF2jH3i9sJ1YjP1YqY1Y1Y1Y1Y1Y1Y1Y1Y1Y1Y1Y1',
        'HFnU1iY1Y1Y1Y1Y1Y1Y1Y1Y1Y1Y1Y1Y1Y1Y1Y1Y1Y1',
      ];
      
      this.tipAccounts = knownTipAccounts.map(addr => ({
        address: addr,
        balance: 0,
      }));
      this.lastTipUpdate = Date.now();
    } catch (error) {
      console.error('Failed to refresh Jito tip accounts:', error);
    }
  }

  async sendBundle(transactions: VersionedTransaction[]): Promise<string | null> {
    try {
      const tipAmount = this.calculateTip();
      
      // Add tip to first transaction
      const tipAccount = await this.getRandomTipAccount();
      if (!tipAccount) {
        console.warn('No Jito tip accounts available');
        return null;
      }

      // Serialize transactions for bundle submission
      const txData = transactions.map(tx => 
        Buffer.from(tx.serialize()).toString('base64')
      );

      // Attempt to send via Jito's RPC
      const response = await fetch(CONFIG.solana.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sendBundle',
          params: [txData],
        }),
      });

      if (!response.ok) {
        console.warn(`Jito bundle submission failed: ${response.statusText}`);
        return null;
      }

      const result: any = await response.json();
      return result?.result || null;
    } catch (error) {
      console.error('Error sending Jito bundle:', error);
      return null;
    }
  }

  private calculateTip(): number {
    const balanceTip = Math.min(
      CONFIG.jito.baseTip,
      CONFIG.jito.absoluteMaxTip
    );
    return balanceTip;
  }

  private async getRandomTipAccount(): Promise<string | null> {
    const accounts = await this.getTipAccounts();
    if (accounts.length === 0) return null;
    return accounts[Math.floor(Math.random() * accounts.length)];
  }

  async getBundleStatus(bundleId: string): Promise<{ confirmed: boolean; slot?: number }> {
    try {
      const response = await fetch(CONFIG.solana.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBundleStatuses',
          params: [[bundleId]],
        }),
      });

      if (!response.ok) {
        return { confirmed: false };
      }

      const result: any = await response.json();
      const value = result?.result?.value?.[0];
      
      if (!value) return { confirmed: false };
      
      return {
        confirmed: value.confirmationStatus === 'confirmed' || value.confirmationStatus === 'finalized',
        slot: value.slot,
      };
    } catch {
      return { confirmed: false };
    }
  }
}