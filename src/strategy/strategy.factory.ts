import Container from 'typedi';
import { STRATEGY } from '@core/env/load-env-data';
import { Strategies, StrategyServices } from './strategy.model';
import { StrategyBuyOnlyGridService } from './buyOnlyGrid/strategy.buy-only-grid.service';

const strategyServices: Record<Strategies, StrategyServices> = {
  BUY_ONLY_GRID: Container.get(StrategyBuyOnlyGridService),
};

export const strategy: StrategyServices = strategyServices[STRATEGY];
