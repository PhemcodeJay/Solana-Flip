"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const web3_js_1 = require("@solana/web3.js");
const settings_1 = require("../config/settings");
const bs58_1 = __importDefault(require("bs58"));
class Wallet {
    constructor() {
        this.connection = new web3_js_1.Connection(settings_1.CONFIG.solana.rpcUrl, 'confirmed');
        if (!settings_1.CONFIG.solana.privateKey || typeof settings_1.CONFIG.solana.privateKey !== 'string') {
            throw new Error('PRIVATE_KEY environment variable is required and must be a valid base58 string');
        }
        const privateKeyBytes = bs58_1.default.decode(settings_1.CONFIG.solana.privateKey);
        this.keypair = web3_js_1.Keypair.fromSecretKey(privateKeyBytes);
        this.publicKey = this.keypair.publicKey;
    }
    async getBalance() {
        const balance = await this.connection.getBalance(this.publicKey);
        return balance / web3_js_1.LAMPORTS_PER_SOL;
    }
    async getTokenBalance(tokenMint) {
        const tokenAccounts = await this.connection.getTokenAccountsByOwner(this.publicKey, { mint: tokenMint });
        if (tokenAccounts.value.length === 0)
            return 0;
        const balance = await this.connection.getTokenAccountBalance(tokenAccounts.value[0].pubkey);
        return parseFloat(balance.value.amount) / Math.pow(10, balance.value.decimals);
    }
    getKeypair() {
        return this.keypair;
    }
    getConnection() {
        return this.connection;
    }
}
exports.Wallet = Wallet;
//# sourceMappingURL=wallet.js.map