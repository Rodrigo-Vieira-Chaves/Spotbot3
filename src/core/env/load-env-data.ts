import { getEnvValue } from './env.utils';
import { Strategies } from '@strategy/strategy.model';
import { Assets, Exchanges } from '@exchange/exchange.model';

export const BOT_NAME = getEnvValue('BOT_NAME');
export const DEV = /true/.test(getEnvValue('DEV'));

export const EXCHANGE = getEnvValue('EXCHANGE', Exchanges);
export const STRATEGY = getEnvValue('STRATEGY', Strategies);
export const EXCHANGE_TEST_NET = /true/.test(getEnvValue('EXCHANGE_TEST_NET'));

export const API_KEY = getEnvValue('API_KEY');
export const API_SECRET = getEnvValue('API_SECRET');

export const BASE_ASSET = getEnvValue('BASE_ASSET', Assets);
export const QUOTE_ASSET = getEnvValue('QUOTE_ASSET', Assets);

export const NEW_RELIC_LICENSE = getEnvValue('NEW_RELIC_LICENSE');
export const NEW_RELIC_LOG_ENDPOINT = getEnvValue('NEW_RELIC_LOG_ENDPOINT');
