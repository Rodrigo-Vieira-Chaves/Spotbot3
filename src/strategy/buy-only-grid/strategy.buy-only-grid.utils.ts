import { log } from '@core/log/log';
import { LogLevels } from '@core/log/log.model';
import { BASE_ASSET } from '@core/env/load-env-data';
import { exchange } from '@exchange/exchange.factory';
import { OrderSides, OrderTypes } from '@exchange/exchange.model';
import {
  BUY_ONLY_GRID_FALL_TOLERANCE,
  BUY_ONLY_GRID_GRID_DISTANCE,
  BUY_ONLY_GRID_STOP_GAIN,
  BUY_ONLY_GRID_TRADE_PAIR,
} from './strategy.buy-only-grid.service';

export async function sendLimitOrder(side: OrderSides, size: number, price: number) {
  const result = await exchange.createOrder({
    pair: BUY_ONLY_GRID_TRADE_PAIR,
    type: OrderTypes.LIMIT,
    side,
    size,
    price,
  });

  log(LogLevels.INFO, 'strategy.orders.sent', [side, OrderTypes.LIMIT, result.price, result.amount, BASE_ASSET]);
}

export async function sendMarketOrder(side: OrderSides, maxBuyOrderSize: number) {
  const orderBook = await exchange.fetchOrderBook(BUY_ONLY_GRID_TRADE_PAIR, 1);

  const size = maxBuyOrderSize / (side === OrderSides.BUY ? orderBook.asks[0][0] : orderBook.bids[0][0]);

  const result = await exchange.createOrder({ pair: BUY_ONLY_GRID_TRADE_PAIR, type: OrderTypes.MARKET, side, size });

  log(LogLevels.INFO, 'strategy.orders.sent', [side, OrderTypes.MARKET, result.average, result.filled, BASE_ASSET]);
}

export function countDecimalPlaces(number: number) {
  return -Math.log10(number);
}

export function calculateMaxBuyOrderSize(currentBalance: number) {
  return currentBalance / (BUY_ONLY_GRID_FALL_TOLERANCE / BUY_ONLY_GRID_GRID_DISTANCE);
}

export function calculateNextBuyPrice(firstPrice: number, buyOrdersFilled: number) {
  return firstPrice * (1 - buyOrdersFilled * (BUY_ONLY_GRID_GRID_DISTANCE / 100));
}

export function calculateNextSellPrice(currentAveragePrice: number) {
  return currentAveragePrice * (1 + BUY_ONLY_GRID_STOP_GAIN / 100);
}

export function calculateNextBuySize(maxBuyOrderSize: number, nextBuyPrice: number) {
  return maxBuyOrderSize / nextBuyPrice;
}
