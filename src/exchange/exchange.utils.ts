import { log } from '@core/log/log';
import { exchange } from './exchange.factory';
import { LogLevels } from '@core/log/log.model';
import { Market, Order, PartialBalances } from 'ccxt';
import { OrderSides, OrderStatus } from './exchange.model';

export function getSpecificAssetBalance(balances: PartialBalances, asset: string) {
  return balances?.[asset] ?? 0;
}

export function hasPair(markets: Market[], pair: string) {
  return markets?.some((market) => market.symbol === pair);
}

export function hasPairs(markets: Market[], pairs: string[]) {
  return markets ? pairs.filter((pair) => !markets.some((market) => market.symbol === pair)) : pairs;
}

export function getPairMinSize(markets: Market[], pair: string) {
  return markets?.find((market) => market.symbol === pair).limits.amount.min;
}

export function formatQtyOnPairMinSize(qty: number, minSize: number) {
  const mult = 10 ** countDecimalPlaces(minSize);
  return Math.floor(qty * mult) / mult;
}

export function countDecimalPlaces(number: number) {
  return -Math.log10(number);
}

export function filterMarketByPairsWithAsset(markets: Market[], asset: string) {
  return markets?.filter((market) => hasAsset(asset, market.symbol));
}

export function filterMarketByPairsWithoutAsset(markets: Market[], asset: string) {
  return markets?.filter((market) => !hasAsset(asset, market.symbol));
}

export function filterOrdersHistoryBySide(orders: Order[], side: OrderSides) {
  return orders?.filter((order) => order.side === side);
}

export function filterOrdersHistoryByStatus(orders: Order[], status: OrderStatus) {
  return orders?.filter((order) => order.status === status);
}

export function makePair(baseAsset: string, quoteAsset: string) {
  return `${baseAsset}/${quoteAsset}`;
}

export function hasAsset(asset: string, pair: string) {
  return pair?.split('/').includes(asset);
}

export function isBaseAsset(asset: string, pair: string) {
  return pair?.split('/')[0] === asset;
}

export function getBaseAsset(pair: string) {
  return pair?.split('/')[0];
}

export function getQuoteAsset(pair: string) {
  return pair?.split('/')[1];
}

export function getOppositeAsset(asset: string, pair: string) {
  return isBaseAsset(asset, pair) ? getQuoteAsset(pair) : getBaseAsset(pair);
}

export async function executeService<T>(service: (...args: any) => Promise<T>, parameters: any[]) {
  let result: T;
  const serviceName = service.name.split(' ')[1];

  try {
    result = await service(...parameters);

    log(LogLevels.DEBUG, 'exchange.service.executed', [exchange.getName(), serviceName, parameters, result]);
  } catch (error) {
    log(LogLevels.ERROR, 'exchange.service.error', [exchange.getName(), serviceName, parameters, error]);
  }

  return result;
}
