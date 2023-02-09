import { Market, Order, OrderBook, PartialBalances } from 'ccxt';

export interface ExchangeServices {
  getName(): string;
  loadSpotMarket(): Promise<Market[]>;
  loadFutureMarket(): Promise<Market[]>;
  fetchTotalBalance(): Promise<PartialBalances>;
  fetchAllOrders(pair: string): Promise<Order[]>;
  fetchOpenOrders(pair: string): Promise<Order[]>;
  fetchClosedOrders(pair: string): Promise<Order[]>;
  fetchOrderBook(pair: string, limit?: number): Promise<OrderBook>;
  createOrder(order: OrderPost): Promise<Order>;
  createTakeProfitOrder(order: TakeProfitOrderPost): Promise<Order>;
  cancelAllOrders(pair: string): Promise<Order[]>;
  watchOrders(pair: string): Promise<Order[]>;
  watchOrderBook(pair: string): Promise<OrderBook>;
  close(): void;
}

export enum Exchanges {
  BINANCE = 'BINANCE',
}

export enum Assets {
  BNB = 'BNB',
  BTC = 'BTC',
  BUSD = 'BUSD',
  ETH = 'ETH',
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
  params?: any;
}

export interface TakeProfitOrderPost extends OrderPost {
  params: { type: 'take_profit'; stopPrice: number };
}
