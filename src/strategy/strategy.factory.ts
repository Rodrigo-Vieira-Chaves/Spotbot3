import Container from 'typedi';
import { STRATEGY } from '@core/env/load-env-data';
import { Strategies, StrategyServices } from './strategy.model';
import { StrategyBuyOnlyGridService } from './buy-only-grid/strategy.buy-only-grid.service';
import { StrategyTriangularArbitrageService } from './triangular-arbitrage/strategy.triangular-arbitrage.service';

const strategyServices: Record<Strategies, StrategyServices> = {
  BUY_ONLY_GRID: Container.get(StrategyBuyOnlyGridService),
  TRIANGULAR_ARBITRAGE: Container.get(StrategyTriangularArbitrageService),
};

export const strategy: StrategyServices = strategyServices[STRATEGY];
