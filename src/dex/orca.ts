import { Connection } from '@solana/web3.js';
import { DEXType, Pool } from './interfaces';

export class OrcaDEX {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async fetchPools(): Promise<Pool[]> {
    try {
      const response = await fetch('https://api.orca.so/v1/pools');
      if (!response.ok) {
        console.warn('Orca API unavailable, using fallback pool data');
        return this.getFallbackPools();
      }
      
      const data = await response.json();
      return this.parseOrcaPools(data);
    } catch {
      console.warn('Could not fetch Orca pools, using fallback data');
      return this.getFallbackPools();
    }
  }

  private parseOrcaPools(data: any): Pool[] {
    const pools: Pool[] = [];
    
    if (!data || typeof data !== 'object') return this.getFallbackPools();

    const poolEntries = Object.entries(data).slice(0, 50);
    for (const [, pool] of poolEntries) {
      const p = pool as any;
      if (!p.tokenA?.mint || !p.tokenB?.mint) continue;
      
      pools.push({
        id: p.id || `orca-${p.tokenA.mint}-${p.tokenB.mint}`,
        dex: DEXType.Orca,
        tokenA: p.tokenA.mint,
        tokenB: p.tokenB.mint,
        price: parseFloat(p.price || '0'),
        liquidity: parseFloat(p.tvl || p.liquidity || '0') || 10000,
        volume24h: parseFloat(p.volume || '0'),
        fee: 0.003, // Orca standard fee 0.3%
      });
    }

    return pools.length > 0 ? pools : this.getFallbackPools();
  }

  private getFallbackPools(): Pool[] {
    return [
      {
        id: 'orca-sol-usdc-1',
        dex: DEXType.Orca,
        tokenA: 'So11111111111111111111111111111111111111112',
        tokenB: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        price: 0,
        liquidity: 400000,
        volume24h: 900000,
        fee: 0.003,
      },
      {
        id: 'orca-sol-usdt-1',
        dex: DEXType.Orca,
        tokenA: 'So11111111111111111111111111111111111111112',
        tokenB: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        price: 0,
        liquidity: 250000,
        volume24h: 600000,
        fee: 0.003,
      },
    ];
  }

  async getPoolPrice(pool: Pool): Promise<{ price: number; liquidity: number }> {
    try {
      const response = await fetch(`https://api.orca.so/v1/pools`);
      if (!response.ok) {
        return { price: pool.price || 150, liquidity: pool.liquidity };
      }
      
      const data = await response.json() as Record<string, any>;
      const poolInfo = data?.[pool.id];
      
      if (poolInfo) {
        return {
          price: parseFloat(poolInfo.price || '0') || 150,
          liquidity: parseFloat(poolInfo.tvl || poolInfo.liquidity || '0') || pool.liquidity,
        };
      }
      
      return { price: pool.price || 150, liquidity: pool.liquidity };
    } catch {
      return { price: pool.price || 150, liquidity: pool.liquidity };
    }
  }
}