import { Market } from 'ccxt';
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
  getPairMinSize,
} from '@exchange/exchange.utils';
import { text } from '@core/localization/locale';
import { TriangularPair } from './strategy.triangular-arbitrage.order-books';

export function sleep(ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendMarketOrder(pair: string, side: OrderSides, size: number) {
  const result = await exchange.createOrder({ pair, type: OrderTypes.MARKET, side, size });
  console.log(
    text('strategy.orders.sent', { ...[side, OrderTypes.MARKET, result.average, result.amount, pair] } as any),
  );

  return result;
}

export function findAllTriangularPairs(markets: Market[]) {
  const pairsWithMainAsset = filterMarketByPairsWithAsset(markets, MAIN_ASSET);
  const pairsWithoutMainAsset = filterMarketByPairsWithoutAsset(markets, MAIN_ASSET);

  const availableTriangularPairs: TriangularPair[] = [];

  for (const midPair of pairsWithoutMainAsset) {
    const firstPair = makePair(getBaseAsset(midPair.symbol), MAIN_ASSET);
    const finalPair = makePair(getQuoteAsset(midPair.symbol), MAIN_ASSET);

    if (hasPairs(pairsWithMainAsset, [firstPair, finalPair]).length === 0) {
      availableTriangularPairs.push({
        [firstPair]: getPairMinSize(markets, firstPair),
        [midPair.symbol]: getPairMinSize(markets, midPair.symbol),
        [finalPair]: getPairMinSize(markets, finalPair),
      });
    }
  }

  return availableTriangularPairs;
}
