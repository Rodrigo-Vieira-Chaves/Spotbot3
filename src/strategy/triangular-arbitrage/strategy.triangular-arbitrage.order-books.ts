import { OrderBook } from 'ccxt';
import { MAIN_ASSET } from '@core/env/load-env-data';
import { OrderSides } from '@exchange/exchange.model';
import { exchange } from '@exchange/exchange.factory';
import { sendMarketOrder } from './strategy.triangular-arbitrage.utils';
import { formatQtyOnPairMinSize, getOppositeAsset, isBaseAsset } from '@exchange/exchange.utils';

export type TriangularPair = { [pair: string]: number };

export class TriangularOrderBooks {
  private readonly orderBooks: { [pair: string]: Book } = {};

  constructor(triangularPair: TriangularPair) {
    for (const pair in triangularPair) {
      const newOrderBook = new Book(pair, triangularPair[pair]);
      newOrderBook.updateBook();

      this.orderBooks[pair] = newOrderBook;
    }
  }

  simulateTrade(balance: number, asset = MAIN_ASSET) {
    for (const pair in this.orderBooks) {
      balance = isBaseAsset(asset, pair)
        ? this.orderBooks[pair].simulateMarketSell(balance)
        : this.orderBooks[pair].simulateMarketBuy(balance);
      asset = getOppositeAsset(asset, pair);
    }

    return balance;
  }

  async executeTrade(balance: number, asset = MAIN_ASSET) {
    for (const pair in this.orderBooks) {
      balance = isBaseAsset(asset, pair)
        ? (await sendMarketOrder(pair, OrderSides.SELL, balance)).cost
        : (await sendMarketOrder(pair, OrderSides.BUY, balance)).filled;

      asset = getOppositeAsset(asset, pair);
    }

    return balance;
  }

  stopOrderBooks() {
    for (const pair in this.orderBooks) {
      this.orderBooks[pair].stopBook();
    }
  }
}

const MAX_ORDER_BOOK_SIZE = 500;

class Book {
  private isRunning = false;
  private readonly orderBook: OrderBook[] = [];

  constructor(private readonly pair: string, private readonly minSize: number) {}

  async updateBook() {
    this.isRunning = true;

    while (this.isRunning) {
      const result = await exchange.watchOrderBook(this.pair);

      if (this.orderBook.length > MAX_ORDER_BOOK_SIZE) {
        this.orderBook.length = 0;
      }

      this.orderBook.push(result);
    }
  }

  stopBook() {
    this.isRunning = false;
  }

  simulateMarketBuy(quoteBalance: number) {
    let baseBalance = 0;
    const asks = this.orderBook.at(-1)?.asks;

    if (!asks || quoteBalance <= 0) {
      return 0;
    }

    for (const ask of asks) {
      const price = ask[0];
      const baseSize = ask[1];

      const quoteSize = price * baseSize;

      if (quoteSize >= quoteBalance) {
        return formatQtyOnPairMinSize(quoteBalance / price + baseBalance, this.minSize);
      }

      quoteBalance -= quoteSize;
      baseBalance += baseSize;
    }
  }

  simulateMarketSell(baseBalance: number) {
    let quoteBalance = 0;
    const bids = this.orderBook.at(-1)?.bids;

    if (!bids || baseBalance <= 0) {
      return 0;
    }

    baseBalance = formatQtyOnPairMinSize(baseBalance, this.minSize);

    for (const bid of bids) {
      const price = bid[0];
      const baseSize = bid[1];

      if (baseSize >= baseBalance) {
        return baseBalance * price + quoteBalance;
      }

      baseBalance -= baseSize;
      quoteBalance += baseSize * price;
    }
  }
}
