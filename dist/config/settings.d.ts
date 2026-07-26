export declare const CONFIG: {
    capital: {
        minStartBalance: number;
        maxPositionSize: number;
        stopLossBalance: number;
    };
    arbitrage: {
        minProfitPct: number;
        maxSlippage: number;
        positionLiquidityRatio: number;
        recheckThreshold: number;
    };
    jito: {
        baseTip: number;
        maxTipPct: number;
        absoluteMaxTip: number;
    };
    execution: {
        maxRetries: number;
        timeoutMs: number;
        cooldownAfterLoss: number;
        cooldownAfterWin: number;
    };
    scanning: {
        intervalMs: number;
        cacheTtlMs: number;
    };
    telegram: {
        botToken: string;
        chatId: string;
    };
    solana: {
        rpcUrl: string;
        privateKey: string;
    };
};
