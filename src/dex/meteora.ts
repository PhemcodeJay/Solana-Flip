import { Connection } from '@solana/web3.js';
import { DEXType, Pool } from './interfaces';

export class MeteoraDEX {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  async fetchPools(): Promise<Pool[]> {
    try {
      const response = await fetch('https://dlmm-api.meteora.ag/pools');
      if (!response.ok) {
        console.warn('Meteora API unavailable, using fallback pool data');
        return this.getFallbackPools();
      }
      
      const data = await response.json();
      return this.parseMeteoraPools(data);
    } catch {
      console.warn('Could not fetch Meteora pools, using fallback data');
      return this.getFallbackPools();
    }
  }

  private parseMeteoraPools(data: any): Pool[] {
    const pools: Pool[] = [];
    
    if (!Array.isArray(data)) return this.getFallbackPools();

    for (const pool of data.slice(0, 50)) {
      if (!pool.tokenAMint || !pool.tokenBMint) continue;
      
      pools.push({
        id: pool.address || pool.id || `meteora-${pool.tokenAMint}-${pool.tokenBMint}`,
        dex: DEXType.Meteora,
        tokenA: pool.tokenAMint,
        tokenB: pool.tokenBMint,
        price: parseFloat(pool.currentPrice || pool.price || '0'),
        liquidity: parseFloat(pool.tvl || pool.liquidity || '0') || 10000,
        volume24h: parseFloat(pool.volume24h || pool.volume || '0'),
        fee: 0.0025, // Meteora standard fee ~0.25%
      });
    }

    return pools.length > 0 ? pools : this.getFallbackPools();
  }

  private getFallbackPools(): Pool[] {
    return [
      {
        id: 'meteora-sol-usdc-1',
        dex: DEXType.Meteora,
        tokenA: 'So11111111111111111111111111111111111111112',
        tokenB: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        price: 0,
        liquidity: 200000,
        volume24h: 400000,
        fee: 0.0025,
      },
    ];
  }

  async getPoolPrice(pool: Pool): Promise<{ price: number; liquidity: number }> {
    try {
      const response = await fetch(`https://dlmm-api.meteora.ag/pools`);
      if (!response.ok) {
        return { price: pool.price || 150, liquidity: pool.liquidity };
      }
      
      const data = await response.json() as any[];
      const poolInfo = data?.find((p: any) => 
        p.address === pool.id || p.id === pool.id
      );
      
      if (poolInfo) {
        return {
          price: parseFloat(poolInfo.currentPrice || poolInfo.price || '0') || 150,
          liquidity: parseFloat(poolInfo.tvl || poolInfo.liquidity || '0') || pool.liquidity,
        };
      }
      
      return { price: pool.price || 150, liquidity: pool.liquidity };
    } catch {
      return { price: pool.price || 150, liquidity: pool.liquidity };
    }
  }
}