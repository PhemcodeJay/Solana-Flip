import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { CONFIG } from '../config/settings';
import bs58 from 'bs58';

export class Wallet {
  private keypair: Keypair;
  private connection: Connection;
  public publicKey: PublicKey;

  constructor() {
    this.connection = new Connection(CONFIG.solana.rpcUrl, 'confirmed');
    
    if (!CONFIG.solana.privateKey || typeof CONFIG.solana.privateKey !== 'string') {
      throw new Error('PRIVATE_KEY environment variable is required and must be a valid base58 string');
    }
    
    const privateKeyBytes = bs58.decode(CONFIG.solana.privateKey);
    this.keypair = Keypair.fromSecretKey(privateKeyBytes);
    this.publicKey = this.keypair.publicKey;
  }

  async getBalance(): Promise<number> {
    const balance = await this.connection.getBalance(this.publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  async getTokenBalance(tokenMint: PublicKey): Promise<number> {
    const tokenAccounts = await this.connection.getTokenAccountsByOwner(
      this.publicKey,
      { mint: tokenMint }
    );

    if (tokenAccounts.value.length === 0) return 0;

    const balance = await this.connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
    return parseFloat(balance.value.amount) / Math.pow(10, balance.value.decimals);
  }

  getKeypair(): Keypair {
    return this.keypair;
  }

  getConnection(): Connection {
    return this.connection;
  }
}