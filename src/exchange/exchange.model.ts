import { Dictionary, Market, Order, OrderBook, PartialBalances } from 'ccxt';

export interface ExchangeServices {
  getName(): string;
  loadMarkets(): Promise<Dictionary<Market>>;
  fetchTotalBalance(): Promise<PartialBalances>;
  fetchAllOrders(pair: string): Promise<Order[]>;
  fetchOpenOrders(pair: string): Promise<Order[]>;
  fetchClosedOrders(pair: string): Promise<Order[]>;
  fetchOrderBook(pair: string, limit?: number): Promise<OrderBook>;
  createOrder(order: OrderPost): Promise<Order>;
  createTakeProfitOrder(order: TakeProfitOrderPost): Promise<Order>;
  cancelAllOrders(pair: string): Promise<Order[]>;
  watchOrders(pair: string): Promise<Order[]>;
  close(): void;
}

export enum Exchanges {
  BINANCE = 'BINANCE',
}

export enum Assets {
  BTC = 'BTC',
  ETH = 'ETH',
  BUSD = 'BUSD',
  USDT = 'USDT',
}

export enum OrderSides {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderTypes {
  LIMIT = 'limit',
  MARKET = 'market',
}

export enum OrderStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  CANCELED = 'canceled',
}

export interface OrderPost {
  pair: string;
  type: OrderTypes;
  side: OrderSides;
  size: number;
  price?: number;
}

export interface TakeProfitOrderPost extends OrderPost {
  params: { type: 'take_profit'; stopPrice: number };
}
