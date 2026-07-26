export declare enum DEXType {
    Raydium = "raydium",
    Orca = "orca",
    Meteora = "meteora"
}
export interface Pool {
    id: string;
    dex: DEXType;
    tokenA: string;
    tokenB: string;
    price: number;
    liquidity: number;
    volume24h: number;
    fee: number;
}
export interface ArbOpportunity {
    pair: string;
    buyDex: DEXType;
    sellDex: DEXType;
    buyPool: Pool;
    sellPool: Pool;
    profitPct: number;
    estimatedProfit: number;
}
