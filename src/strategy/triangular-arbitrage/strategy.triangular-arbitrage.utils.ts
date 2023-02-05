import { log } from 'winston';
import { Market } from 'ccxt';
import { LogLevels } from '@core/log/log.model';
import { MAIN_ASSET } from '@core/env/load-env-data';
import { exchange } from '@exchange/exchange.factory';
import { OrderSides, OrderTypes } from '@exchange/exchange.model';
import {
  filterMarketByPairsWithAsset,
  filterMarketByPairsWithoutAsset,
  makePair,
  getBaseAsset,
  getQuoteAsset,
  hasPairs,
} from '@exchange/exchange.utils';

export function sleep(ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendMarketOrder(pair: string, side: OrderSides, size: number) {
  const result = await exchange.createOrder({ pair, type: OrderTypes.MARKET, side, size });
  log(LogLevels.INFO, 'strategy.orders.sent', [side, OrderTypes.MARKET, result.average, result.amount, pair]);

  return result;
}

export function findAllTriangularPairs(markets: Market[]) {
  const pairsWithMainAsset = filterMarketByPairsWithAsset(markets, MAIN_ASSET);
  const pairsWithoutMainAsset = filterMarketByPairsWithoutAsset(markets, MAIN_ASSET);

  const availableTriangularPairs: string[][] = [];

  for (const midPair of pairsWithoutMainAsset) {
    const firstPair = makePair(getBaseAsset(midPair.symbol), MAIN_ASSET);
    const finalPair = makePair(getQuoteAsset(midPair.symbol), MAIN_ASSET);

    if (hasPairs(pairsWithMainAsset, [firstPair, finalPair]).length === 0) {
      availableTriangularPairs.push([firstPair, midPair.symbol, finalPair]);
    }
  }

  return availableTriangularPairs;
}
