import { Connection, Keypair, PublicKey } from '@solana/web3.js';
export declare class Wallet {
    private keypair;
    private connection;
    publicKey: PublicKey;
    constructor();
    getBalance(): Promise<number>;
    getTokenBalance(tokenMint: PublicKey): Promise<number>;
    getKeypair(): Keypair;
    getConnection(): Connection;
}
