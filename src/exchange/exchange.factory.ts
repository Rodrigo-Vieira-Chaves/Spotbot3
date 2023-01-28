import Container from 'typedi';
import { Binance } from './exchange.binance';
import { EXCHANGE } from '@core/env/load-env-data';
import { Exchanges, ExchangeServices } from './exchange.model';

const exchangeServices: Record<Exchanges, ExchangeServices> = {
  BINANCE: Container.get(Binance),
};

export const exchange: ExchangeServices = exchangeServices[EXCHANGE];
