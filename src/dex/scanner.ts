import { Connection } from '@solana/web3.js';
import { DEXType, Pool, ArbOpportunity } from './interfaces';
import { RaydiumDEX } from './raydium';
import { OrcaDEX } from './orca';
import { MeteoraDEX } from './meteora';
import { CONFIG } from '../config/settings';

export class DexScanner {
  private raydium: RaydiumDEX;
  private orca: OrcaDEX;
  private meteora: MeteoraDEX;
  private allPools: Pool[] = [];
  private lastFetchTime: number = 0;
  private readonly cacheTtlMs: number;

  constructor(connection: Connection) {
    this.raydium = new RaydiumDEX(connection);
    this.orca = new OrcaDEX(connection);
    this.meteora = new MeteoraDEX(connection);
    this.cacheTtlMs = CONFIG.scanning.cacheTtlMs;
  }

  async fetchAllPools(): Promise<Pool[]> {
    if (Date.now() - this.lastFetchTime < this.cacheTtlMs && this.allPools.length > 0) {
      return this.allPools;
    }

    try {
      const [raydiumPools, orcaPools, meteoraPools] = await Promise.all([
        this.raydium.fetchPools(),
        this.orca.fetchPools(),
        this.meteora.fetchPools(),
      ]);

      this.allPools = [...raydiumPools, ...orcaPools, ...meteoraPools];
      this.lastFetchTime = Date.now();

      console.log(`Fetched ${this.allPools.length} pools across all DEXes`);
    } catch (error) {
      console.error('Error fetching pools:', error);
      if (this.allPools.length === 0) {
        // Use fallback pools if we have nothing
        this.allPools = [
          ...this.raydium['getFallbackPools'](),
          ...this.orca['getFallbackPools'](),
          ...this.meteora['getFallbackPools'](),
        ];
      }
    }

    return this.allPools;
  }

  async findArbitrageOpportunities(): Promise<ArbOpportunity[]> {
    const pools = await this.fetchAllPools();
    const opportunities: ArbOpportunity[] = [];

    // Group pools by token pair (normalize token order)
    const pairGroups = this.groupPoolsByPair(pools);

    for (const [, groupPools] of pairGroups) {
      if (groupPools.length < 2) continue;

      // Compare prices across different DEXes for the same pair
      for (let i = 0; i < groupPools.length; i++) {
        for (let j = i + 1; j < groupPools.length; j++) {
          const poolA = groupPools[i];
          const poolB = groupPools[j];

          if (poolA.dex === poolB.dex) continue; // Skip same DEX

          // Get real-time prices
          const [priceA, priceB] = await Promise.all([
            this.raydium.getPoolPrice(poolA),
            this.orca.getPoolPrice(poolB),
          ]);

          const priceDiff = Math.abs(priceA.price - priceB.price);
          const avgPrice = (priceA.price + priceB.price) / 2;
          const profitPct = (priceDiff / avgPrice) * 100;

          // Check if profit meets minimum threshold
          if (profitPct >= CONFIG.arbitrage.minProfitPct) {
            const opportunity: ArbOpportunity = {
              pair: `${poolA.tokenA.slice(0, 8)}-${poolA.tokenB.slice(0, 8)}`,
              buyDex: priceA.price < priceB.price ? poolA.dex : poolB.dex,
              sellDex: priceA.price < priceB.price ? poolB.dex : poolA.dex,
              buyPool: priceA.price < priceB.price ? poolA : poolB,
              sellPool: priceA.price < priceB.price ? poolB : poolA,
              profitPct,
              estimatedProfit: 0, // Will be calculated with position size
            };

            opportunities.push(opportunity);
          }
        }
      }
    }

    // Sort by profit percentage descending
    opportunities.sort((a, b) => b.profitPct - a.profitPct);

    return opportunities;
  }

  private groupPoolsByPair(pools: Pool[]): Map<string, Pool[]> {
    const groups = new Map<string, Pool[]>();

    for (const pool of pools) {
      // Normalize pair key (sort tokens alphabetically)
      const pairKey = [pool.tokenA, pool.tokenB].sort().join('-');
      
      if (!groups.has(pairKey)) {
        groups.set(pairKey, []);
      }
      groups.get(pairKey)!.push(pool);
    }

    return groups;
  }
}