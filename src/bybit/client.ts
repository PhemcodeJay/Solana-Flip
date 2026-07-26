export interface BybitOrder {
  symbol: string;
  side: 'Buy' | 'Sell';
  orderType: 'Market' | 'Limit';
  qty: string;
  price?: string;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface BybitPosition {
  symbol: string;
  side: 'Buy' | 'Sell';
  size: string;
  entryPrice: string;
  markPrice: string;
  liqPrice: string;
  unrealizedPnl: string;
}

export class BybitClient {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private isEnabled: boolean;

  constructor() {
    this.apiKey = process.env.BYBIT_API_KEY || '';
    this.apiSecret = process.env.BYBIT_API_SECRET || '';
    this.baseUrl = 'https://api.bybit.com';
    this.isEnabled = !!(this.apiKey && this.apiSecret);
  }

  private async request(endpoint: string, params: Record<string, any> = {}, method: 'GET' | 'POST' = 'GET'): Promise<any> {
    if (!this.isEnabled) {
      return { ret_code: 10001, ret_msg: 'Bybit not configured', result: null };
    }

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-BAPI-API-KEY': this.apiKey,
          'X-BAPI-TIMESTAMP': Date.now().toString(),
          'X-BAPI-RECV-WINDOW': '5000',
        },
      };

      if (method === 'POST') {
        options.body = JSON.stringify(params);
      }

      const response = await fetch(`${url}?${new URLSearchParams(params)}`, options);

      if (!response.ok) {
        return { ret_code: response.status, ret_msg: response.statusText, result: null };
      }

      return await response.json();
    } catch (error) {
      return { ret_code: 500, ret_msg: String(error), result: null };
    }
  }

  async getBalance(): Promise<{ [key: string]: number }> {
    const result = await this.request('/v5/account/wallet-balance', {
      accountType: 'UNIFIED',
    });

    if (result?.ret_code !== 0 || !result?.result?.list?.[0]?.coin) {
      return {};
    }

    const balances: { [key: string]: number } = {};
    for (const coin of result.result.list[0].coin) {
      const walletBalance = parseFloat(coin.walletBalance || '0');
      if (walletBalance > 0) {
        balances[coin.coin] = walletBalance;
      }
    }

    return balances;
  }

  async getPositions(symbol?: string): Promise<BybitPosition[]> {
    const params: Record<string, any> = { category: 'linear' };
    if (symbol) params.symbol = symbol;

    const result = await this.request('/v5/position/list', params);

    if (result?.ret_code !== 0 || !result?.result?.list) {
      return [];
    }

    return result.result.list.map((p: any) => ({
      symbol: p.symbol,
      side: p.side,
      size: p.size,
      entryPrice: p.entryPrice,
      markPrice: p.markPrice,
      liqPrice: p.liqPrice,
      unrealizedPnl: p.unrealizedPnl,
    }));
  }

  async placeOrder(order: BybitOrder): Promise<{ orderId?: string; error?: string }> {
    const result = await this.request('/v5/order/create', {
      category: 'linear',
      symbol: order.symbol,
      side: order.side,
      orderType: order.orderType,
      qty: order.qty,
      ...(order.price && { price: order.price }),
      ...(order.timeInForce && { timeInForce: order.timeInForce }),
    }, 'POST');

    if (result?.ret_code === 0 && result?.result?.orderId) {
      return { orderId: result.result.orderId };
    }

    return { error: result?.ret_msg || 'Unknown error' };
  }

  async getMarketPrice(symbol: string): Promise<number> {
    const result = await this.request('/v5/market/tickers', { category: 'linear', symbol });

    if (result?.ret_code === 0 && result?.result?.list?.[0]?.lastPrice) {
      return parseFloat(result.result.list[0].lastPrice);
    }

    return 0;
  }

  async closePosition(symbol: string): Promise<{ orderId?: string; error?: string }> {
    const positions = await this.getPositions(symbol);

    for (const position of positions) {
      if (parseFloat(position.size) <= 0) continue;

      const result = await this.placeOrder({
        symbol: position.symbol,
        side: position.side === 'Buy' ? 'Sell' : 'Buy',
        orderType: 'Market',
        qty: position.size,
        timeInForce: 'IOC',
      });

      if (result.orderId) {
        return result;
      } else {
        return { error: result.error };
      }
    }

    return { error: 'No position to close' };
  }

  isConfigured(): boolean {
    return this.isEnabled;
  }
}