import { Service } from 'typedi';
import { API_KEY, API_SECRET, EXCHANGE_TEST_NET } from '@core/env/load-env-data';
import { executeService, filterOrdersHistoryByStatus } from './exchange.utils';
import { Dictionary, Market, Order, OrderBook, PartialBalances, pro as ccxt } from 'ccxt';
import { ExchangeServices, OrderPost, OrderStatus, TakeProfitOrderPost } from './exchange.model';

const ORDER_BOOK_LIMIT = 100;

@Service()
export class Binance implements ExchangeServices {
  private readonly exchange = new ccxt.binance({ newUpdates: true });

  constructor() {
    this.exchange.apiKey = API_KEY;
    this.exchange.secret = API_SECRET;
    this.exchange.setSandboxMode(EXCHANGE_TEST_NET);
  }

  getName() {
    return this.exchange.name;
  }

  async loadSpotMarket() {
    const markets = await executeService<Dictionary<Market>>(this.exchange.loadMarkets.bind(this.exchange), []);

    return Object.values(markets).filter((market) => market.active && market.type === 'spot');
  }

  async loadFutureMarket() {
    const markets = await executeService<Dictionary<Market>>(this.exchange.loadMarkets.bind(this.exchange), []);

    return Object.values(markets).filter((market) => market.active && market.type === 'future');
  }

  fetchTotalBalance() {
    return executeService<PartialBalances>(this.exchange.fetchTotalBalance.bind(this.exchange), []);
  }

  fetchAllOrders(pair: string) {
    return executeService<Order[]>(this.exchange.fetchOrders.bind(this.exchange), [pair]);
  }

  async fetchOpenOrders(pair: string) {
    const orders = await this.fetchAllOrders(pair);
    return filterOrdersHistoryByStatus(orders, OrderStatus.OPEN);
  }

  async fetchClosedOrders(pair: string) {
    const orders = await this.fetchAllOrders(pair);
    return filterOrdersHistoryByStatus(orders, OrderStatus.CLOSED);
  }

  fetchOrderBook(pair: string, limit?: number) {
    return executeService<OrderBook>(this.exchange.fetchOrderBook.bind(this.exchange), [pair, limit]);
  }

  createOrder(order: OrderPost) {
    return executeService<Order>(this.exchange.createOrder.bind(this.exchange), Object.values(order));
  }

  createTakeProfitOrder(order: TakeProfitOrderPost) {
    const takeProfitOrderPost = Object.values(order);
    takeProfitOrderPost.splice(-1, 0, undefined);

    return executeService<Order>(this.exchange.createOrder.bind(this.exchange), takeProfitOrderPost);
  }

  async cancelAllOrders(pair: string) {
    const openOrdersResult = await this.fetchOpenOrders(pair);

    if (!openOrdersResult.length) {
      return [];
    }

    return executeService<Order[]>(this.exchange.cancelAllOrders.bind(this.exchange), [pair]);
  }

  watchOrders(pair: string) {
    return executeService<Order[]>(this.exchange.watchOrders.bind(this.exchange), [pair]);
  }

  watchOrderBook(pair: string) {
    return executeService<OrderBook>(this.exchange.watchOrderBook.bind(this.exchange), [pair, ORDER_BOOK_LIMIT]);
  }

  close() {
    return this.exchange.close();
  }
}
