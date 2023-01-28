import { log } from '@core/log/log';
import { exchange } from './exchange.factory';
import { LogLevels } from '@core/log/log.model';
import { OrderSides, OrderStatus } from './exchange.model';
import { Dictionary, Market, Order, PartialBalances } from 'ccxt';

export function checkPairExistenceInMarket(markets: Dictionary<Market>, pair: string) {
  return markets ? Object.keys(markets).includes(pair) : false;
}

export function getSpecificAssetBalance(balances: PartialBalances, asset: string) {
  return balances?.[asset] ?? 0;
}

export function filterOrdersHistoryBySide(orders: Order[], side: OrderSides) {
  return orders?.filter((order) => order.side === side);
}

export function filterOrdersHistoryByStatus(orders: Order[], status: OrderStatus) {
  return orders?.filter((order) => order.status === status);
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
